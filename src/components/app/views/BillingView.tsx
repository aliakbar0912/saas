"use client";

import { CreditCard, AlertTriangle } from "lucide-react";
import { useWorkspaces } from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

export function BillingView() {
  const workspacesQuery = useWorkspaces();
  const ws = workspacesQuery.data?.items?.[0];

  if (workspacesQuery.isLoading) return <LoadingState label="Loading billing..." />;
  if (workspacesQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load billing"
        description={(workspacesQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => workspacesQuery.refetch() }}
      />
    );
  }

  if (!ws) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No workspace"
        description="Your workspace will be created on first login."
      />
    );
  }

  const planName = ws.plan?.toUpperCase() || "FREE";
  const planPrice = ws.plan === "pro" ? "$39/mo" : ws.plan === "business" ? "$119/mo" : ws.plan === "starter" ? "$15/mo" : "Free";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current plan</div>
            <h2 className="text-2xl font-semibold mt-1">{planName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{planPrice} · billed monthly</p>
          </div>
          <span className="rounded-full bg-white text-black px-3 py-1 text-xs font-medium">ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-3">Payment method</h3>
          <div className="rounded-lg border border-border bg-background/40 p-3 text-center py-8">
            <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">No payment method on file</div>
            <button className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-8 px-3 text-xs font-medium hover:bg-white/90 transition-colors">
              Add payment method
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-3">Recent invoices</h3>
          <div className="py-8 text-center">
            <div className="text-xs text-muted-foreground">No invoices yet</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Invoices appear here after your first billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
