import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/usage — workspace's current billing-cycle usage
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

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  try {
    const res = await pb.collection("usage").getList(1, 1, {
      filter: `workspace = "${workspace.id}" && period = "${period}"`,
    });

    let usage;
    if (res.items.length === 0) {
      // Create new usage record for this period
      usage = await pb.collection("usage").create({
        workspace: workspace.id,
        period,
        ai_generations: 0,
        posts_published: 0,
        comments: 0,
        automation_runs: 0,
        storage_used_mb: 0,
        limits: {
          ai_generations: workspace.plan === "pro" ? 2000 : workspace.plan === "business" ? 10000 : 50,
          posts_published: workspace.plan === "pro" ? 200 : workspace.plan === "business" ? 1000 : 50,
          comments: workspace.plan === "pro" ? 250 : 100,
          automation_runs: workspace.plan === "pro" ? 2000 : 100,
          storage_used_mb: workspace.plan === "pro" ? 10240 : 500,
          connected_accounts: workspace.plan === "pro" ? 10 : workspace.plan === "business" ? 999 : 2,
        },
      });
    } else {
      usage = res.items[0];
    }

    // Count connected accounts separately
    const accounts = await pb.collection("social_accounts").getList(1, 1, {
      filter: `workspace = "${workspace.id}"`,
    });

    const limits = usage.limits || {};
    return NextResponse.json({
      ok: true,
      items: [
        { label: "AI Generations", used: usage.ai_generations || 0, limit: limits.ai_generations || 50 },
        { label: "Comments", used: usage.comments || 0, limit: limits.comments || 100 },
        { label: "Automation Runs", used: usage.automation_runs || 0, limit: limits.automation_runs || 100 },
        { label: "Posts Published", used: usage.posts_published || 0, limit: limits.posts_published || 50 },
        { label: "Connected Accounts", used: accounts.totalItems, limit: limits.connected_accounts || 2 },
        { label: "Storage", used: usage.storage_used_mb || 0, limit: limits.storage_used_mb || 500, unit: "MB" },
      ],
      period,
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
