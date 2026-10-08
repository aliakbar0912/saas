import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/social-accounts — list current user's connected accounts
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json({ ok: true, items: [], schemaSetupRequired: true });
  }

  try {
    const accounts = await pb.collection("social_accounts").getFullList({
      filter: `workspace = "${workspace.id}"`,
      sort: "-created",
    });

    return NextResponse.json({
      ok: true,
      items: accounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        username: a.username,
        displayName: a.display_name,
        status: a.status || "disconnected",
        followers: a.followers || 0,
        permissions: a.permissions || [],
        contentPermissions: a.content_permissions || [],
        lastSync: a.last_sync,
        health: a.health || 0,
        avatar: a.avatar || null,
        created: a.created,
      })),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to fetch accounts: ${e.message}` },
      { status: 500 },
    );
  }
}

// POST /api/social-accounts — connect a new account (manual credentials for now)
// Real OAuth requires per-platform app credentials which the user configures separately.
// This route stores the metadata; actual OAuth token exchange happens server-side
// through dedicated /api/oauth/[platform] routes when credentials are configured.
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json({ ok: true, items: [], schemaSetupRequired: true });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { platform, username, displayName } = body;

  if (!platform || !username) {
    return NextResponse.json(
      { ok: false, error: "platform and username are required." },
      { status: 400 },
    );
  }

  try {
    const created = await pb.collection("social_accounts").create({
      workspace: workspace.id,
      owner: user.id,
      platform,
      username,
      display_name: displayName || username,
      status: "connected",
      followers: 0,
      permissions: [],
      content_permissions: [],
      last_sync: new Date().toISOString(),
      health: 100,
    });

    return NextResponse.json({
      ok: true,
      account: {
        id: created.id,
        platform: created.platform,
        username: created.username,
        status: created.status,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to connect account: ${e.message}` },
      { status: 500 },
    );
  }
}
