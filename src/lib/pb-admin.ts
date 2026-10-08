// ============================================================
// Server-only admin PocketBase client
// ============================================================
// Used for:
//   - Schema migrations (creating/updating collections)
//   - Privileged operations (e.g. webhook ingestion)
//
// CRITICAL: This module is server-only. It imports `server-only`
// to fail the build if accidentally imported client-side.
// Admin credentials come from env vars and NEVER reach the browser.
// ============================================================

import "server-only";
import PocketBase from "pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.POCKETBASE_URL ||
  "https://pocketbase.mughalx.tech";

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || "";

let adminPb: PocketBase | null = null;
let authExpiresAt = 0;

export function isPbAdminConfigured(): boolean {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
}

/**
 * Returns an authenticated PocketBase admin client.
 * Re-authenticates every ~5 minutes (PocketBase admin tokens last 1 day).
 */
export async function getPbAdmin(): Promise<PocketBase> {
  if (!isPbAdminConfigured()) {
    throw new Error(
      "POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set to perform admin operations.",
    );
  }

  if (!adminPb) {
    adminPb = new PocketBase(POCKETBASE_URL);
    adminPb.autoCancellation(false);
  }

  // Re-auth if token is close to expiring (5 min buffer)
  if (Date.now() >= authExpiresAt) {
    try {
      await adminPb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      // PocketBase admin tokens last 1 day; refresh every 50 min
      authExpiresAt = Date.now() + 50 * 60 * 1000;
    } catch (err) {
      // Fallback: legacy /api/admins/auth-with-password for older PocketBase versions
      try {
        await adminPb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        authExpiresAt = Date.now() + 50 * 60 * 1000;
      } catch (err2) {
        const e = err2 as Error;
        throw new Error(
          `Failed to authenticate as PocketBase admin. Check POCKETBASE_ADMIN_EMAIL/POCKETBASE_ADMIN_PASSWORD. Original error: ${e.message}`,
        );
      }
    }
  }

  return adminPb;
}

/**
 * Get the URL of the PocketBase instance (server-only safe).
 */
export function pbUrl(): string {
  return POCKETBASE_URL;
}
