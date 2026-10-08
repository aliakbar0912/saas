import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/approvals?status=pending
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
  const status = url.searchParams.get("status") || "pending";
  const filters = [`workspace = "${workspace.id}"`];
  if (status !== "all") filters.push(`status = "${status}"`);

  try {
    const items = await pb.collection("approval_queue").getFullList({
      filter: filters.join(" && "),
      sort: "-created",
    });
    return NextResponse.json({
      ok: true,
      items: items.map((a) => ({
        id: a.id,
        type: a.type,
        platform: a.platform,
        content: a.content,
        confidence: a.confidence || 0,
        status: a.status,
        createdAt: a.created,
        reviewedAt: a.reviewed_at,
      })),
      counts: {
        pending: items.filter((i) => i.status === "pending").length,
        approved: items.filter((i) => i.status === "approved").length,
        rejected: items.filter((i) => i.status === "rejected").length,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
