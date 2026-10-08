import { NextResponse } from "next/server";
import { isRedisConfigured, tryGetQueueBackend } from "@/lib/redis";

// GET /api/health/redis
// Returns the Redis connection status. Used by:
//   - Deployment health checks
//   - The SetupBanner component (to show Redis status)
//   - Monitoring/uptime checks
//
// This endpoint does NOT expose the Redis URL, password, or any
// connection string details. It only returns:
//   - configured: boolean (is REDIS_URL set?)
//   - connected: boolean (can we PING Redis?)
export async function GET() {
  const configured = isRedisConfigured();

  if (!configured) {
    return NextResponse.json({
      ok: false,
      configured: false,
      connected: false,
      error: "REDIS_URL is not set in the environment.",
    });
  }

  const queue = tryGetQueueBackend();
  if (!queue) {
    return NextResponse.json({
      ok: false,
      configured: true,
      connected: false,
      error: "Redis is configured but the ioredis package is not installed.",
    });
  }

  // Try to PING Redis. This is the actual connectivity test.
  // If the hostname doesn't resolve (e.g., not on the same Docker network),
  // this will return false.
  try {
    const connected = await queue.ping();
    return NextResponse.json({
      ok: connected,
      configured: true,
      connected,
      error: connected ? null : "Redis did not respond to PING.",
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({
      ok: false,
      configured: true,
      connected: false,
      error: `Redis connection failed: ${e.message}`,
    });
  }
}
