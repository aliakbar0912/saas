import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";

// DELETE /api/media/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const { id } = await params;
  const pb = userPbClient(user.token);
  try {
    await pb.collection("media").delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// PATCH /api/media/[id] — rename / update tags
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
    // empty
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.tags !== undefined) update.tags = body.tags;

  try {
    const updated = await pb.collection("media").update(id, update);
    return NextResponse.json({ ok: true, media: { id: updated.id, name: updated.name } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
