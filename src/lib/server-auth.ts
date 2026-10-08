// ============================================================
// Server-side auth helpers
// ============================================================
// Verifies the requesting user from their PocketBase auth token,
// which is sent in the Authorization header or pb_auth cookie.
// ============================================================

import "server-only";
import PocketBase from "pocketbase";

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.POCKETBASE_URL ||
  "https://pocketbase.mughalx.tech";

export interface ServerAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
  token: string;
}

/**
 * Extract the user from a request. Returns null if unauthenticated.
 */
export async function getRequestUser(req: Request): Promise<ServerAuthUser | null> {
  // Try Authorization header first
  let token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";

  // Fall back to pb_auth cookie
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("pb_auth=")) {
        const raw = decodeURIComponent(c.slice("pb_auth=".length));
        try {
          const parsed = JSON.parse(raw);
          token = parsed.token || "";
        } catch {
          // ignore malformed cookie
        }
        break;
      }
    }
  }

  if (!token) return null;

  // Verify token by hitting PocketBase authRefresh (without persisting)
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  pb.authStore.save(token, null as never);

  try {
    const authData = await pb.collection("users").authRefresh();
    const record = authData.record;
    if (!record) return null;
    return {
      id: record.id,
      email: (record.email as string) ?? "",
      name: (record.name as string) ?? undefined,
      avatar: (record.avatar as string) ?? undefined,
      verified: (record.verified as boolean) ?? false,
      token: authData.token,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the PocketBase URL (server-side safe).
 */
export function serverPbUrl(): string {
  return POCKETBASE_URL;
}

/**
 * Build a fresh PocketBase client authenticated as a specific user.
 */
export function userPbClient(token: string): PocketBase {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);
  pb.authStore.save(token, null as never);
  return pb;
}
