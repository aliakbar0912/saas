// ============================================================
// Redis client (server-only)
// ============================================================
// Redis is MANDATORY for this application's queue operations:
//   - Scheduled publishing (delayed jobs)
//   - Background workers (post publishing, automation runs)
//   - Rate limiting (per-platform/per-hour caps)
//   - Distributed locks (prevent double-publishing)
//   - Temporary job state
//
// There is NO in-memory fallback. If REDIS_URL is not set or Redis
// is unreachable, queue-dependent operations fail with a clear error.
// We never pretend a job was queued when it wasn't.
//
// REDIS_URL is server-side only (this module imports "server-only").
// The password inside the URL never reaches the browser, client bundles,
// logs, or API responses.
// ============================================================

import "server-only";

const REDIS_URL = process.env.REDIS_URL || "";

export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL);
}

// ============================================================
// Queue backend interface
// ============================================================

export interface QueueBackend {
  /** Push a JSON-serializable job onto a queue. Returns job id. */
  enqueue(queue: string, payload: unknown, opts?: { delaySeconds?: number }): Promise<string>;
  /** Peek + claim the next job from a queue (blocking-pop style). */
  dequeue(queue: string, timeoutSeconds?: number): Promise<{ id: string; payload: unknown } | null>;
  /** Mark a job as done. */
  ack(queue: string, jobId: string): Promise<void>;
  /** Re-queue a job (with optional delay for backoff). */
  nack(queue: string, jobId: string, payload: unknown, delaySeconds?: number): Promise<void>;
  /** Set a key with TTL (for rate limiting / locks). */
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  /** Get a key. */
  get(key: string): Promise<string | null>;
  /** Increment a counter (rate limiting). Returns new value. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  /** Delete a key. */
  del(key: string): Promise<void>;
  /** Health check — returns true if Redis responds to PING. */
  ping(): Promise<boolean>;
  /** Close connections. */
  close(): Promise<void>;
}

// ============================================================
// Error class for Redis failures
// ============================================================

export class RedisUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisUnavailableError";
  }
}

// ============================================================
// ioredis-backed implementation
// ============================================================

class IoredisBackend implements QueueBackend {
  private client: {
    zadd: (k: string, s: number, d: string) => Promise<number>;
    lpush: (k: string, d: string) => Promise<number>;
    zrangebyscore: (k: string, min: number, max: number, ...args: unknown[]) => Promise<string[]>;
    zrem: (k: string, d: string) => Promise<number>;
    brpop: (k: string, t: number) => Promise<[string, string] | null>;
    set: (k: string, v: string, ...args: unknown[]) => Promise<string | null>;
    get: (k: string) => Promise<string | null>;
    multi: () => {
      incr: (k: string) => void;
      expire: (k: string, t: number, flag: string) => void;
      exec: () => Promise<[Error | null, unknown][]>;
    };
    del: (k: string) => Promise<number>;
    ping: () => Promise<string>;
    quit: () => Promise<void>;
    on: (event: string, cb: (err: Error) => void) => void;
  };
  private idCounter = 0;

  constructor(url: string) {
    const moduleName = "ioredis";
    let IoredisCtor: new (url: string, opts: Record<string, unknown>) => unknown;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(moduleName);
      IoredisCtor = (mod.default || mod) as new (url: string, opts: Record<string, unknown>) => unknown;
    } catch {
      throw new RedisUnavailableError(
        `REDIS_URL is set but the "ioredis" package is not installed. Run: bun add ioredis`,
      );
    }
    // Create the client — ioredis connects lazily on first command.
    // Settings:
    //   - maxRetriesPerRequest: 3 → allow 3 retries before failing a command
    //   - connectTimeout: 5000 → give up connecting after 5 seconds
    //   - enableOfflineQueue: true → queue commands while connecting (so PING
    //     waits for the connection instead of failing immediately)
    //   - retryStrategy → reconnect with backoff
    this.client = new IoredisCtor(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 5) return null;
        return Math.min(times * 200, 1000);
      },
      enableOfflineQueue: true,
      connectTimeout: 5000,
    }) as typeof this.client;

    // Log connection errors WITHOUT exposing the URL/password
    this.client.on("error", (err: Error) => {
      // Log a sanitized message — never log the Redis URL (it contains the password)
      console.error("[redis] Connection error:", err.message);
    });
  }

  async enqueue(queue: string, payload: unknown, opts?: { delaySeconds?: number }): Promise<string> {
    const id = `job-${Date.now()}-${++this.idCounter}`;
    const data = JSON.stringify({ id, payload });
    try {
      if (opts?.delaySeconds && opts.delaySeconds > 0) {
        const score = Date.now() + opts.delaySeconds * 1000;
        await this.client.zadd(`queue:${queue}:delayed`, score, data);
      } else {
        await this.client.lpush(`queue:${queue}`, data);
      }
      return id;
    } catch (err) {
      throw new RedisUnavailableError(
        `Failed to enqueue job on Redis: ${(err as Error).message}`,
      );
    }
  }

  async dequeue(queue: string, timeoutSeconds = 5): Promise<{ id: string; payload: unknown } | null> {
    const now = Date.now();
    try {
      const delayed: string[] = await this.client.zrangebyscore(`queue:${queue}:delayed`, 0, now, "LIMIT", 0, 1);
      if (delayed && delayed.length > 0) {
        const removed: number = await this.client.zrem(`queue:${queue}:delayed`, delayed[0]);
        if (removed === 1) {
          try {
            const parsed = JSON.parse(delayed[0]);
            return { id: parsed.id, payload: parsed.payload };
          } catch {
            // fallthrough to BRPOP
          }
        }
      }
      const res: [string, string] | null = await this.client.brpop(`queue:${queue}`, timeoutSeconds);
      if (!res) return null;
      try {
        const parsed = JSON.parse(res[1]);
        return { id: parsed.id, payload: parsed.payload };
      } catch {
        return null;
      }
    } catch (err) {
      throw new RedisUnavailableError(
        `Failed to dequeue job from Redis: ${(err as Error).message}`,
      );
    }
  }

  async ack(_queue: string, _jobId: string): Promise<void> {
    // In our LPUSH/BRPOP model, jobs are already removed when dequeued.
    // This is a no-op. For idempotency tracking, we rely on the
    // external_post_id field in PocketBase, not on ack/nack.
  }

  async nack(queue: string, _jobId: string, payload: unknown, delaySeconds?: number): Promise<void> {
    await this.enqueue(queue, payload, { delaySeconds });
  }

  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    try {
      const res: string | null = await this.client.set(key, value, "NX", "EX", ttlSeconds);
      return res === "OK";
    } catch (err) {
      throw new RedisUnavailableError(
        `Failed to acquire lock on Redis: ${(err as Error).message}`,
      );
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      throw new RedisUnavailableError(
        `Failed to get key from Redis: ${(err as Error).message}`,
      );
    }
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttlSeconds, "NX");
      const results: [Error | null, unknown][] = await multi.exec();
      return results[0][1] as number;
    } catch (err) {
      throw new RedisUnavailableError(
        `Failed to increment counter on Redis: ${(err as Error).message}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      throw new RedisUnavailableError(
        `Failed to delete key on Redis: ${(err as Error).message}`,
      );
    }
  }

  async ping(): Promise<boolean> {
    try {
      // Race the PING against a 3-second timeout so the health check
      // doesn't hang when Redis is unreachable (e.g., DNS doesn't resolve).
      const result = await Promise.race([
        this.client.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("PING timeout (10s)")), 10000),
        ),
      ]);
      return result === "PONG";
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      // ignore close errors
    }
  }
}

// Singleton
let backend: QueueBackend | null = null;

/**
 * Returns the Redis-backed queue backend.
 *
 * Throws RedisUnavailableError if:
 *   - REDIS_URL is not set in the environment
 *   - The ioredis package is not installed
 *
 * Does NOT fall back to in-memory queues. Redis is mandatory.
 * Callers must catch RedisUnavailableError and return a clean
 * HTTP error to the client.
 */
export function getQueueBackend(): QueueBackend {
  if (!backend) {
    if (!isRedisConfigured()) {
      throw new RedisUnavailableError(
        "REDIS_URL is not set. Redis is required for queue operations (publishing, scheduling, automation, rate limiting). Set REDIS_URL in your environment.",
      );
    }
    backend = new IoredisBackend(REDIS_URL);
  }
  return backend;
}

/**
 * Non-throwing variant. Returns null if Redis is not configured.
 * Use this in API routes where you want to return a clean 503
 * instead of a 500. When this returns null, the caller MUST return
 * an error response — it must NOT pretend the operation succeeded.
 */
export function tryGetQueueBackend(): QueueBackend | null {
  try {
    return getQueueBackend();
  } catch {
    return null;
  }
}
