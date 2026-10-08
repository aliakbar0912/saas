import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/analytics?period=30d
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
  const period = url.searchParams.get("period") || "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const records = await pb.collection("analytics").getFullList({
      filter: `workspace = "${workspace.id}" && date >= "${since}"`,
      sort: "date",
    });

    // Aggregate
    const totals = records.reduce(
      (acc, r) => {
        acc.reach += (r.reach as number) || 0;
        acc.impressions += (r.impressions as number) || 0;
        acc.likes += (r.likes as number) || 0;
        acc.comments += (r.comments as number) || 0;
        acc.shares += (r.shares as number) || 0;
        acc.saves += (r.saves as number) || 0;
        return acc;
      },
      { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
    );

    const engagement = totals.impressions > 0
      ? ((totals.likes + totals.comments + totals.shares + totals.saves) / totals.impressions) * 100
      : 0;

    // Group by day for the chart
    const byDay = new Map<string, { reach: number; impressions: number; engagement: number }>();
    for (const r of records) {
      const day = (r.date as string).split(" ")[0];
      const e = byDay.get(day) || { reach: 0, impressions: 0, engagement: 0 };
      e.reach += (r.reach as number) || 0;
      e.impressions += (r.impressions as number) || 0;
      e.engagement += (r.likes as number) + (r.comments as number) + (r.shares as number) + (r.saves as number);
      byDay.set(day, e);
    }

    return NextResponse.json({
      ok: true,
      totals: {
        ...totals,
        engagement: Number(engagement.toFixed(2)),
        records: records.length,
      },
      trend: Array.from(byDay.entries()).map(([date, v]) => ({
        date,
        reach: v.reach,
        impressions: v.impressions,
        engagement: v.engagement,
      })),
      hasData: records.length > 0,
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
