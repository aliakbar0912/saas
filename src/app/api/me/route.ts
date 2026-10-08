import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/me — returns the current user + their default workspace
// This also ensures the user has a workspace (creates one on first call).

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  const pb = userPbClient(user.token);
  let workspace;
  try {
    workspace = await ensureDefaultWorkspace(pb, user.id, user.email);
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to load workspace: ${e.message}` },
      { status: 500 },
    );
  }

  if (!workspace) {
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        verified: user.verified,
      },
      workspace: null,
      schemaSetupRequired: true,
      message: "PocketBase schema not configured. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env, then run: bun run pb:setup",
    });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      verified: user.verified,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      owner: workspace.owner,
    },
  });
}
