"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Edit3,
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  useApprovals,
  useUpdateApproval,
} from "@/lib/hooks/api";
import { platformMeta } from "@/lib/platforms";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

export function ApprovalsView() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const pushToast = useStore((s) => s.pushToast);

  const approvalsQuery = useApprovals(filter);
  const updateMutation = useUpdateApproval();

  const items = approvalsQuery.data?.items ?? [];
  const counts = approvalsQuery.data?.counts ?? { pending: 0, approved: 0, rejected: 0 };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateMutation.mutateAsync({ id, status });
      pushToast({
        type: status === "approved" ? "success" : "warning",
        title: status === "approved" ? "Content approved" : "Content rejected",
        description: status === "approved"
          ? "Item will publish at the next window."
          : "AI will not retry this generation.",
      });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Action failed", description: e.message });
    }
  };

  if (approvalsQuery.isLoading) return <LoadingState label="Loading approvals..." />;
  if (approvalsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load approvals"
        description={(approvalsQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => approvalsQuery.refetch() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Pending" value={counts.pending} icon={Clock} tone="warning" />
        <SummaryCard label="Approved" value={counts.approved} icon={Check} tone="active" />
        <SummaryCard label="Rejected" value={counts.rejected} icon={X} tone="failed" />
      </div>

      <div className="inline-flex items-center rounded-lg border border-border bg-card/40 p-0.5 text-xs">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors capitalize",
              filter === f ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No ${filter} items`}
          description={
            filter === "pending"
              ? "AI-generated content awaiting your review will appear here."
              : filter === "approved"
                ? "Items you approve will move to publishing and show up here for the day."
                : "Items you reject will be listed here with the rejection reason."
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const meta = item.platform ? platformMeta[item.platform as keyof typeof platformMeta] : null;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card/40 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg border border-border bg-background/40 flex items-center justify-center text-[10px] font-medium shrink-0">
                      {meta?.glyph ?? "AI"}
                    </div>
                    <div>
                      <div className="text-sm font-medium capitalize">{item.type}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {meta?.name ?? "—"} · {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Confidence</div>
                    <div className="text-sm font-mono text-white">
                      {Math.round((item.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background/40 p-4 mb-3">
                  <p className="text-sm leading-relaxed text-pretty whitespace-pre-wrap">{item.content}</p>
                </div>

                {filter === "pending" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleAction(item.id, "approved")}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
                    >
                      {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "rejected")}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 text-red-400 h-9 px-4 text-xs hover:bg-red-400/10 transition-colors disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "active" | "warning" | "failed";
}) {
  const colors = {
    active: "bg-white text-black",
    warning: "bg-amber-400/10 text-amber-400",
    failed: "bg-red-400/10 text-red-400",
  };
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", colors[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
