"use client";

import { motion } from "framer-motion";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsage } from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

export function UsageView() {
  const usageQuery = useUsage();

  if (usageQuery.isLoading) return <LoadingState label="Loading usage..." />;
  if (usageQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load usage"
        description={(usageQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => usageQuery.refetch() }}
      />
    );
  }

  const items = usageQuery.data?.items ?? [];
  const period = usageQuery.data?.period ?? "—";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card/40 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold">Usage</h2>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Period: {period}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Workspace consumption for this billing cycle
        </p>

        {items.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No usage data yet"
            description="Start using the platform to see your consumption metrics here."
            size="sm"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((u) => {
              const pct = u.limit > 0 ? (u.used / u.limit) * 100 : 0;
              return (
                <div key={u.label} className="rounded-lg border border-border bg-background/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium">{u.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {u.used}{u.unit || ""} / {u.limit}{u.unit || ""}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {u.used}
                    {u.unit ? <span className="text-xs text-muted-foreground ml-1">{u.unit}</span> : null}
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "h-full rounded-full",
                        pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-white",
                      )}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    {Math.round(pct)}% used · resets at end of billing cycle
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
