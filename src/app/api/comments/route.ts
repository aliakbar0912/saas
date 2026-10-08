import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/comments?status=new
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
  const status = url.searchParams.get("status");
  const filters = [`workspace = "${workspace.id}"`];
  if (status && status !== "all") filters.push(`status = "${status}"`);

  try {
    const items = await pb.collection("comments").getFullList({
      filter: filters.join(" && "),
      sort: "-created",
      expand: "social_account",
    });
    return NextResponse.json({
      ok: true,
      items: items.map((c) => ({
        id: c.id,
        platform: c.expand?.social_account?.platform || c.social_account,
        author: c.author,
        content: c.content,
        postTitle: c.post_title,
        aiReply: c.ai_reply,
        status: c.status,
        confidence: c.confidence || 0,
        receivedAt: c.received_at,
        created: c.created,
      })),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
