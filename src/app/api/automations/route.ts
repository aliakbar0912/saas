import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/automations?status=active
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
  const filter = [`workspace = "${workspace.id}"`];
  if (status && status !== "all") filter.push(`status = "${status}"`);

  try {
    const items = await pb.collection("automations").getFullList({
      filter: filter.join(" && "),
      sort: "-created",
    });
    return NextResponse.json({
      ok: true,
      items: items.map((a) => ({
        id: a.id,
        name: a.name,
        trigger: a.trigger,
        triggerConfig: a.trigger_config,
        conditions: a.conditions || [],
        actions: a.actions || [],
        status: a.status,
        rateLimits: a.rate_limits,
        lastExecution: a.last_execution,
        runCount: a.run_count || 0,
        errorCount: a.error_count || 0,
        created: a.created,
      })),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST /api/automations — create automation
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

  const { name, trigger, triggerConfig, conditions, actions, status, rateLimits } = body;
  if (!name || !trigger || !actions) {
    return NextResponse.json(
      { ok: false, error: "name, trigger, and actions are required." },
      { status: 400 },
    );
  }
  try {
    const created = await pb.collection("automations").create({
      workspace: workspace.id,
      created_by: user.id,
      name,
      trigger,
      trigger_config: triggerConfig || {},
      conditions: conditions || [],
      actions,
      status: status || "active",
      rate_limits: rateLimits || {
        max_per_day: 50,
        max_per_hour: 10,
        min_delay_seconds: 45,
      },
      run_count: 0,
      error_count: 0,
    });
    return NextResponse.json({ ok: true, automation: { id: created.id } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
