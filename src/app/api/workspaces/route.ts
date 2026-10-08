import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/workspaces — list user's workspaces
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

  // Count members
  let memberCount = 1;
  try {
    const res = await pb.collection("workspace_members").getList(1, 1, {
      filter: `workspace = "${workspace.id}" && status = "active"`,
    });
    memberCount = res.totalItems;
  } catch {
    // ignore
  }

  // Count connected accounts
  let accountCount = 0;
  try {
    const res = await pb.collection("social_accounts").getList(1, 1, {
      filter: `workspace = "${workspace.id}"`,
    });
    accountCount = res.totalItems;
  } catch {
    // ignore
  }

  // Count active automations
  let automationCount = 0;
  try {
    const res = await pb.collection("automations").getList(1, 1, {
      filter: `workspace = "${workspace.id}" && status = "active"`,
    });
    automationCount = res.totalItems;
  } catch {
    // ignore
  }

  return NextResponse.json({
    ok: true,
    items: [
      {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan,
        members: memberCount,
        connectedAccounts: accountCount,
        activeAutomations: automationCount,
        created: workspace.created,
      },
    ],
    current: workspace.id,
  });
}

// PATCH /api/workspaces — rename the current workspace
export async function PATCH(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json({ ok: true, items: [], schemaSetupRequired: true });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim();
  }

  try {
    const updated = await pb.collection("workspaces").update(workspace.id, update);
    return NextResponse.json({
      ok: true,
      workspace: { id: updated.id, name: updated.name },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
