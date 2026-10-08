"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  BarChart3,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/lib/hooks/api";
import { platformMeta } from "@/lib/platforms";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

type Period = "7d" | "30d" | "90d" | "1y";

export function AnalyticsView() {
  const [period, setPeriod] = useState<Period>("30d");

  const analyticsQuery = useAnalytics(period);

  if (analyticsQuery.isLoading) return <LoadingState label="Loading analytics..." />;
  if (analyticsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load analytics"
        description={(analyticsQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => analyticsQuery.refetch() }}
      />
    );
  }

  const data = analyticsQuery.data;
  const totals = data?.totals;
  const hasData = data?.hasData ?? false;

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet."
        description="Connect an account and publish content to start seeing analytics. Reach, impressions, and engagement metrics will appear here once data is available."
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center rounded-lg border border-border bg-card/40 p-0.5 text-xs">
          {(["7d", "30d", "90d", "1y"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors",
                period === p ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "1y" ? "1 year" : p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Reach" value={formatNum(totals?.reach ?? 0)} icon={Eye} />
        <KPICard label="Impressions" value={formatNum(totals?.impressions ?? 0)} icon={Eye} />
        <KPICard label="Engagement" value={`${totals?.engagement ?? 0}%`} icon={Heart} />
        <KPICard label="Likes" value={formatNum(totals?.likes ?? 0)} icon={Heart} />
        <KPICard label="Comments" value={formatNum(totals?.comments ?? 0)} icon={MessageSquare} />
        <KPICard label="Shares" value={formatNum(totals?.shares ?? 0)} icon={Share2} />
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-medium">Engagement trend</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Reach vs impressions vs engagement</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <LegendItem color="bg-white" label="Reach" />
            <LegendItem color="bg-white/40" label="Impressions" />
            <LegendItem color="bg-white/20" label="Engagement" />
          </div>
        </div>
        <LineChart trend={data?.trend ?? []} />
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function KPICard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 w-7 rounded-md border border-border bg-background/40 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="text-xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      {label}
    </span>
  );
}

function LineChart({ trend }: { trend: { date: string; reach: number; impressions: number; engagement: number }[] }) {
  const w = 600;
  const h = 200;
  const max = Math.max(
    ...trend.map((t) => Math.max(t.reach, t.impressions, t.engagement)),
    1,
  );

  const toPath = (key: "reach" | "impressions" | "engagement") => {
    if (trend.length === 0) return "";
    return trend.map((t, i) => {
      const x = (i / Math.max(trend.length - 1, 1)) * w;
      const y = h - (t[key] / max) * h;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[400px] h-[200px]">
        {[0, 25, 50, 75, 100].map((g) => (
          <line
            key={g}
            x1={0}
            x2={w}
            y1={h - (g / 100) * h}
            y2={h - (g / 100) * h}
            stroke="currentColor"
            strokeOpacity={0.05}
            strokeWidth={1}
          />
        ))}
        <path d={toPath("impressions")} fill="none" stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.5} />
        <path d={toPath("engagement")} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />
        <path d={toPath("reach")} fill="none" stroke="currentColor" strokeOpacity={1} strokeWidth={2} />
      </svg>
      {trend.length > 0 && (
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
          {trend.map((t, i) => (
            i % Math.ceil(trend.length / 6) === 0 ? <span key={t.date}>{t.date}</span> : null
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// AI Insights view — empty state until analytics data exists
// ============================================================

export function InsightsView() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-to-b from-white/[0.04] to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">AI Insights</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Nexus analyzes your performance data and surfaces patterns you can act on.
              Each insight includes a recommended action and the confidence behind the recommendation.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors shrink-0"
            onClick={() => alert("Generate Strategy requires analytics data. Connect an account and publish content to enable.")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Strategy
          </button>
        </div>
      </div>

      <EmptyState
        icon={Sparkles}
        title="No insights yet."
        description="AI Insights appear after your connected accounts start generating performance data. Connect an account, publish content, and check back in a few days."
        size="lg"
      />
    </div>
  );
}
