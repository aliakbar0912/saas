// ============================================================
// Infrastructure health check (server-only)
// ============================================================
// Used by /api/health to report the status of all dependencies.
// ============================================================

import "server-only";
import { isRedisConfigured, tryGetQueueBackend } from "./redis";
import { isPbAdminConfigured } from "./pb-admin";

export interface HealthStatus {
  ok: boolean;
  timestamp: string;
  pocketbase: {
    url: string;
    reachable: boolean;
    adminConfigured: boolean;
    schemaReady: boolean;
    missingCollections: string[];
    totalCollections: number;
  };
  redis: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
  worker: {
    running: boolean;
    lastHeartbeat?: string;
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const pbUrl =
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    process.env.POCKETBASE_URL ||
    "https://pocketbase.mughalx.tech";

  // Check PocketBase
  let pbReachable = false;
  try {
    const res = await fetch(`${pbUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    pbReachable = res.ok;
  } catch {
    pbReachable = false;
  }

  // Check schema readiness (only if admin is configured)
  let schemaReady = false;
  let missingCollections: string[] = [];
  let totalCollections = 0;
  if (pbReachable && isPbAdminConfigured()) {
    try {
      const { getMigrationStatus } = await import("./pb-migrate");
      const status = await getMigrationStatus();
      schemaReady = status.missing.length === 0;
      missingCollections = status.missing;
      totalCollections = status.total;
    } catch {
      schemaReady = false;
    }
  }

  // Check Redis
  let redisConnected = false;
  let redisError: string | undefined;
  if (isRedisConfigured()) {
    const queue = tryGetQueueBackend();
    if (queue) {
      try {
        redisConnected = await queue.ping();
        if (!redisConnected) redisError = "Redis did not respond to PING";
      } catch (err) {
        redisError = (err as Error).message;
      }
    } else {
      redisError = "ioredis package not installed";
    }
  } else {
    redisError = "REDIS_URL not set";
  }

  const ok = pbReachable && redisConnected;

  // Check worker heartbeat (written to /tmp by the worker process)
  let workerRunning = false;
  let workerHeartbeat: string | undefined;
  try {
    const fs = await import("fs/promises");
    const raw = await fs.readFile("/tmp/nexus-worker-heartbeat", "utf-8");
    const data = JSON.parse(raw) as { running: boolean; lastBeat: string };
    workerRunning = data.running;
    workerHeartbeat = data.lastBeat;
    // Consider worker dead if no heartbeat in 60 seconds
    if (workerHeartbeat) {
      const age = Date.now() - new Date(workerHeartbeat).getTime();
      if (age > 60_000) workerRunning = false;
    }
  } catch {
    // heartbeat file doesn't exist — worker not running
  }

  return {
    ok,
    timestamp: new Date().toISOString(),
    pocketbase: {
      url: pbUrl,
      reachable: pbReachable,
      adminConfigured: isPbAdminConfigured(),
      schemaReady,
      missingCollections,
      totalCollections,
    },
    redis: {
      configured: isRedisConfigured(),
      connected: redisConnected,
      error: redisError,
    },
    worker: {
      running: workerRunning,
      lastHeartbeat: workerHeartbeat,
    },
  };
}
