// ============================================================
// Workspace helpers (server-side)
// ============================================================
// Every authenticated user belongs to at least one workspace.
// On signup, we auto-create a personal workspace for them.
// ============================================================

import "server-only";
import PocketBase from "pocketbase";

interface WorkspaceRecord {
  id: string;
  name: string;
  owner: string;
  plan?: string;
  created: string;
  updated: string;
}

/**
 * Returns the user's default workspace, creating it on first call.
 * This is called from API routes when the user has no workspace yet.
 *
 * If the `workspaces` collection doesn't exist yet (admin setup pending),
 * returns null instead of throwing — callers should respond with an empty
 * state and instruct the user to run migrations.
 */
export async function ensureDefaultWorkspace(
  pb: PocketBase,
  userId: string,
  userEmail: string,
): Promise<WorkspaceRecord | null> {
  // Look for an existing workspace where the user is owner
  let existing;
  try {
    existing = await pb.collection("workspaces").getList(1, 1, {
      filter: `owner = "${userId}"`,
      sort: "-created",
    });
  } catch (err) {
    // Collection doesn't exist yet — admin setup pending
    const e = err as { status?: number };
    if (e.status === 404) {
      return null;
    }
    throw err;
  }

  if (existing.items.length > 0) {
    const w = existing.items[0];
    return {
      id: w.id,
      name: (w.name as string) || "Personal",
      owner: (w.owner as string) || userId,
      plan: (w.plan as string) || "free",
      created: (w.created as string) || "",
      updated: (w.updated as string) || "",
    };
  }

  // Create one — derive a friendly name from the email
  const localPart = userEmail.split("@")[0] || "you";
  const name = `${localPart.charAt(0).toUpperCase()}${localPart.slice(1)}'s workspace`;

  let created;
  try {
    created = await pb.collection("workspaces").create({
      name,
      owner: userId,
      plan: "free",
      settings: {},
    });
  } catch (err) {
    const e = err as { status?: number };
    if (e.status === 404) {
      return null;
    }
    throw err;
  }

  // Make the user a member with role "owner"
  try {
    await pb.collection("workspace_members").create({
      workspace: created.id,
      user: userId,
      role: "owner",
      status: "active",
    });
  } catch {
    // members table may not exist yet — non-fatal
  }

  // Initialize usage record for this billing period
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  try {
    await pb.collection("usage").create({
      workspace: created.id,
      period,
      ai_generations: 0,
      posts_published: 0,
      comments: 0,
      automation_runs: 0,
      storage_used_mb: 0,
      limits: {
        ai_generations: 50,
        posts_published: 100,
        comments: 50,
        automation_runs: 100,
        storage_used_mb: 500,
        connected_accounts: 2,
      },
    });
  } catch {
    // usage record may already exist; ignore
  }

  return {
    id: created.id,
    name,
    owner: userId,
    plan: "free",
    created: (created.created as string) || "",
    updated: (created.updated as string) || "",
  };
}

/**
 * Returns all workspaces the user has access to.
 */
export async function getUserWorkspaces(pb: PocketBase, userId: string): Promise<WorkspaceRecord[]> {
  const res = await pb.collection("workspaces").getFullList({
    filter: `owner = "${userId}" || members.user = "${userId}"`,
  });
  return res.map((w) => ({
    id: w.id,
    name: (w.name as string) || "Untitled",
    owner: (w.owner as string) || "",
    plan: (w.plan as string) || "free",
    created: (w.created as string) || "",
    updated: (w.updated as string) || "",
  }));
}

/**
 * Verify the user is a member of the given workspace.
 * Returns the membership record if they are, else null.
 */
export async function verifyWorkspaceAccess(
  pb: PocketBase,
  workspaceId: string,
  userId: string,
): Promise<{ role: string } | null> {
  try {
    // Direct owner check
    const ws = await pb.collection("workspaces").getOne(workspaceId);
    if ((ws.owner as string) === userId) {
      return { role: "owner" };
    }
  } catch {
    return null; // workspace doesn't exist
  }
  // Member check
  try {
    const member = await pb.collection("workspace_members").getFirstListItem(
      `workspace = "${workspaceId}" && user = "${userId}" && status = "active"`,
    );
    return { role: (member.role as string) || "viewer" };
  } catch {
    return null;
  }
}

/**
 * Sentinel error response — used by API routes to signal that
 * the PocketBase schema hasn't been set up yet.
 */
export const SCHEMA_NOT_SETUP = {
  ok: false,
  error: "Schema not configured. The PocketBase collections haven't been created yet. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in your .env file, then run: bun run pb:setup",
  schemaSetupRequired: true,
} as const;
