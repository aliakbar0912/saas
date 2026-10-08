"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Link2,
  Clock,
} from "lucide-react";
import { useWorkspaces } from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

export function WorkspaceView() {
  const workspacesQuery = useWorkspaces();

  if (workspacesQuery.isLoading) return <LoadingState label="Loading workspace..." />;
  if (workspacesQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load workspace"
        description={(workspacesQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => workspacesQuery.refetch() }}
      />
    );
  }

  const workspaces = workspacesQuery.data?.items ?? [];
  const ws = workspaces[0];

  if (!ws) {
    return (
      <EmptyState
        icon={Building2}
        title="No workspace found"
        description="Your workspace will be created automatically on first login."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-gradient-to-b from-white/[0.04] to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center shrink-0">
            <div className="h-6 w-6 bg-black rounded-sm" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{ws.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your workspace for AI-powered social media automation. {ws.members} member{ws.members !== 1 ? "s" : ""} · {ws.connectedAccounts} connected account{ws.connectedAccounts !== 1 ? "s" : ""} · {ws.plan} plan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 uppercase">{ws.plan}</span>
              <span className="rounded-full border border-border bg-background/40 px-2 py-0.5">
                Created {ws.created ? new Date(ws.created).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border h-9 px-3 text-xs hover:bg-accent transition-colors">
            <Building2 className="h-3.5 w-3.5" />
            Switch workspace
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Members" value={ws.members} sub="in this workspace" icon={Users} />
        <StatCard label="Connected accounts" value={ws.connectedAccounts} sub="of your plan limit" icon={Activity} />
        <StatCard label="Active automations" value={ws.activeAutomations} sub="running now" icon={Zap} />
        <StatCard label="Workspace age" value={ws.created ? daysSince(ws.created) : "—"} sub="days" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-4">Recent activity</h3>
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Actions you take — posts, automations, approvals — will appear here."
            size="sm"
          />
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-4">Quick actions</h3>
          <div className="space-y-2">
            <ActionRow
              icon={Link2}
              label="Connect a social account"
              description="Add your first platform connection"
              onClick={() => (window.location.hash = "accounts")}
            />
            <ActionRow
              icon={Zap}
              label="Create an automation"
              description="Build a workflow to engage with content automatically"
              onClick={() => (window.location.hash = "automations")}
            />
            <ActionRow
              icon={TrendingUp}
              label="View analytics"
              description="See how your content is performing"
              onClick={() => (window.location.hash = "analytics")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="h-8 w-8 rounded-lg border border-border bg-background/40 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      <div className="text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3 hover:bg-card transition-colors text-left"
    >
      <div className="h-8 w-8 rounded-lg border border-border bg-card/60 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
      </div>
    </button>
  );
}

function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}
