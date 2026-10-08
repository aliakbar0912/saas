import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";

// PATCH /api/notifications/[id] — mark read (or unread)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const { id } = await params;
  const pb = userPbClient(user.token);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // default action: mark read
    body = { read: true };
  }

  try {
    const update: Record<string, unknown> = {};
    if (body.read !== undefined) {
      update.read = Boolean(body.read);
      update.read_at = body.read ? new Date().toISOString() : null;
    }
    const updated = await pb.collection("notifications").update(id, update);
    return NextResponse.json({ ok: true, notification: { id: updated.id, read: updated.read } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// DELETE /api/notifications/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const { id } = await params;
  const pb = userPbClient(user.token);
  try {
    await pb.collection("notifications").delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
