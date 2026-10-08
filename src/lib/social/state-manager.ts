// ============================================================
// OAuth State Manager — cryptographically secure state generation
// and validation for OAuth flows.
// ============================================================
// State is stored in Redis with a short TTL so it survives across
// the OAuth redirect (which is a separate HTTP request).
// ============================================================

import "server-only";
import { randomBytes } from "crypto";
import { tryGetQueueBackend } from "@/lib/redis";

const STATE_PREFIX = "oauth:state:";
const STATE_TTL = 600; // 10 minutes

export interface OAuthStateData {
  state: string;
  userId: string;
  workspaceId: string;
  platform: string;
  createdAt: number;
}

/**
 * Generate a cryptographically secure OAuth state and store it in Redis.
 */
export async function generateOAuthState(
  userId: string,
  workspaceId: string,
  platform: string,
): Promise<string> {
  const state = randomBytes(32).toString("hex");
  const data: OAuthStateData = {
    state,
    userId,
    workspaceId,
    platform,
    createdAt: Date.now(),
  };

  const queue = tryGetQueueBackend();
  if (!queue) {
    throw new Error("Redis is required for OAuth state management.");
  }

  // Store state in Redis with TTL
  await queue.setNX(
    `${STATE_PREFIX}${state}`,
    JSON.stringify(data),
    STATE_TTL,
  );

  return state;
}

/**
 * Validate an OAuth state against what's stored in Redis.
 * Returns the stored state data if valid, null otherwise.
 * Consumes (deletes) the state so it can't be replayed.
 */
export async function validateOAuthState(state: string): Promise<OAuthStateData | null> {
  const queue = tryGetQueueBackend();
  if (!queue) {
    throw new Error("Redis is required for OAuth state management.");
  }

  const raw = await queue.get(`${STATE_PREFIX}${state}`);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as OAuthStateData;
    // Delete the state so it can't be reused
    await queue.del(`${STATE_PREFIX}${state}`);
    return data;
  } catch {
    return null;
  }
}
