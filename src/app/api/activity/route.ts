import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/activity?limit=20 — recent activity logs for the dashboard feed
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

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");

  try {
    const res = await pb.collection("activity_logs").getList(1, limit, {
      filter: `workspace = "${workspace.id}"`,
      sort: "-created",
      expand: "user",
    });
    return NextResponse.json({
      ok: true,
      items: res.items.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        details: l.details,
        user: l.expand?.user
          ? { id: l.expand.user.id, name: l.expand.user.name, email: l.expand.user.email }
          : null,
        created: l.created,
      })),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
