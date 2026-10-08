import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";

// PATCH /api/automations/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const { id } = await params;
  const pb = userPbClient(user.token);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const allowed: Record<string, string> = {
    name: "name",
    trigger: "trigger",
    triggerConfig: "trigger_config",
    conditions: "conditions",
    actions: "actions",
    status: "status",
    rateLimits: "rate_limits",
  };
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (allowed[k]) update[allowed[k]] = v;
  }

  try {
    const updated = await pb.collection("automations").update(id, update);
    return NextResponse.json({ ok: true, automation: { id: updated.id, status: updated.status } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// DELETE /api/automations/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const { id } = await params;
  const pb = userPbClient(user.token);
  try {
    await pb.collection("automations").delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
