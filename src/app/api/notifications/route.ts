import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/notifications
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
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = parseInt(url.searchParams.get("perPage") || "30");

  try {
    const res = await pb.collection("notifications").getList(page, perPage, {
      filter: `workspace = "${workspace.id}"`,
      sort: "-created",
    });
    const items = res.items.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      description: n.description,
      read: Boolean(n.read),
      link: n.link,
      created: n.created,
    }));
    const unread = items.filter((i) => !i.read).length;
    return NextResponse.json({
      ok: true,
      items,
      unread,
      page: res.page,
      perPage: res.perPage,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST /api/notifications/mark-all-read
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

  try {
    const items = await pb.collection("notifications").getFullList({
      filter: `workspace = "${workspace.id}" && read = false`,
    });
    const now = new Date().toISOString();
    for (const n of items) {
      await pb.collection("notifications").update(n.id, { read: true, read_at: now });
    }
    return NextResponse.json({ ok: true, marked: items.length });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
