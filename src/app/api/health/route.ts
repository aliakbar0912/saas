import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

// GET /api/health
// Returns the status of all infrastructure dependencies.
// This endpoint is public (no auth required) so it can be used
// by deployment health checks and monitoring.
//
// Response shape:
// {
//   ok: boolean,                    // true only if PB is reachable AND Redis is connected
//   timestamp: string,
//   pocketbase: {
//     url: string,
//     reachable: boolean,           // can we hit /api/health on PocketBase?
//     adminConfigured: boolean,     // are POCKETBASE_ADMIN_EMAIL/PASSWORD set?
//     schemaReady: boolean,        // are all 18 collections present?
//     missingCollections: string[], // which ones are missing?
//     totalCollections: number
//   },
//   redis: {
//     configured: boolean,          // is REDIS_URL set?
//     connected: boolean,           // can we PING Redis?
//     error?: string
//   },
//   worker: { running: boolean }
// }
//
// Does NOT expose any credentials, passwords, or connection strings.
export async function GET() {
  try {
    const status = await checkHealth();
    const httpStatus = status.ok ? 200 : 503;
    return NextResponse.json(status, { status: httpStatus });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      {
        ok: false,
        error: `Health check failed: ${e.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
