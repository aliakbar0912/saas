"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Clock,
  Bot,
  CheckCircle2,
  Zap,
  TrendingUp,
  Users,
  Pause,
  XCircle,
  ChevronRight,
  RefreshCw,
  Radio,
  ChevronDown,
  Link2,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useActivity, usePosts, useSocialAccounts, useAutomations } from "@/lib/hooks/api";
import { platformMeta } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { EmptyState, EmptyStateInline } from "../EmptyState";
import { PanelSkeleton, StatSkeleton } from "../LoadingState";

export function OverviewView() {
  const setView = useStore((s) => s.setView);

  const postsQuery = usePosts();
  const accountsQuery = useSocialAccounts();
  const automationsQuery = useAutomations();
  const activityQuery = useActivity(8);

  const loading = postsQuery.isLoading || accountsQuery.isLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PanelSkeleton className="lg:col-span-2" />
          <PanelSkeleton />
          <PanelSkeleton className="lg:col-span-2" />
          <PanelSkeleton />
        </div>
      </div>
    );
  }

  const posts = postsQuery.data?.items ?? [];
  const accounts = accountsQuery.data?.items ?? [];
  const automations = automationsQuery.data?.items ?? [];
  const activity = activityQuery.data?.items ?? [];

  // Stats calculated from real data
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const connectedAccounts = accounts.filter((a) => a.status === "connected").length;
  const activeAutomations = automations.filter((a) => a.status === "active").length;
  const pausedAutomations = automations.filter((a) => a.status === "paused").length;
  const failedAutomations = automations.filter((a) => a.status === "failed").length;

  // Today's queue: posts scheduled for today
  const today = new Date().toISOString().split("T")[0];
  const todayQueue = posts
    .filter((p) => p.scheduledAt && p.scheduledAt.split("T")[0] === today)
    .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  const stats = [
    { label: "Connected Accounts", value: String(connectedAccounts), sub: "of your plan limit", icon: Users },
    { label: "Posts Scheduled", value: String(scheduledPosts), sub: "upcoming", icon: Clock },
    { label: "Posts Published", value: String(publishedPosts), sub: "all-time", icon: CheckCircle2 },
    { label: "Active Automations", value: String(activeAutomations), sub: "running", icon: Zap },
    { label: "Failed", value: String(failedAutomations), sub: "need attention", icon: XCircle },
    { label: "Activity (24h)", value: String(activity.length), sub: "events logged", icon: TrendingUp },
  ];

  const isEmpty = posts.length === 0 && accounts.length === 0 && automations.length === 0;

  return (
    <div className="space-y-6">
      {isEmpty && (
        <EmptyState
          icon={Sparkles}
          title="Welcome to your workspace."
          description="Connect a social account to start automating your content, scheduling, and engagement."
          action={{ label: "Connect account", onClick: () => setView("accounts") }}
          secondaryAction={{ label: "Create your first post", onClick: () => setView("create") }}
        />
      )}

      {/* Live status ticker */}
      <LiveStatusTicker
        connectedAccounts={connectedAccounts}
        activeAutomations={activeAutomations}
        failedAutomations={failedAutomations}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card/40 p-4 hover:bg-card/70 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-8 w-8 rounded-lg border border-border bg-background/40 flex items-center justify-center">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Queue */}
        <Panel
          className="lg:col-span-2"
          title="Today's Queue"
          subtitle={todayQueue.length === 0 ? "No posts scheduled for today" : `${todayQueue.length} post${todayQueue.length > 1 ? "s" : ""} scheduled today`}
          action={
            <button
              onClick={() => setView("calendar")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Open calendar
              <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          {todayQueue.length === 0 ? (
            <EmptyStateInline
              icon={Clock}
              title="Nothing scheduled for today"
              description="Create a post and schedule it to see it appear here."
            />
          ) : (
            <div className="divide-y divide-border">
              {todayQueue.map((post) => {
                const time = post.scheduledAt
                  ? new Date(post.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : "—";
                const platform = (post.platform as keyof typeof platformMeta) || "instagram";
                const meta = platformMeta[platform];
                const statusColor = statusDotColor(post.status);

                return (
                  <div key={post.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="text-xs font-mono text-muted-foreground w-12 shrink-0">{time}</div>
                    <div className="h-9 w-9 rounded-lg border border-border bg-background/40 flex items-center justify-center text-[10px] font-medium shrink-0">
                      {meta?.glyph ?? "PS"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{post.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {meta?.name ?? post.platform} · {post.type} {post.socialAccount ? `· ${post.socialAccount.username}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground capitalize hidden sm:inline">{post.status}</span>
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusColor)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* AI Activity */}
        <Panel
          title="Recent Activity"
          subtitle="Audit log feed"
          action={
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
              </span>
              Live
            </span>
          }
        >
          {activity.length === 0 ? (
            <EmptyStateInline
              icon={Bot}
              title="No activity yet"
              description="Actions you take — posts, automations, approvals — will appear here."
            />
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {activity.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-2.5 overflow-hidden"
                  >
                    <div className="h-6 w-6 rounded-full border border-border bg-background/40 flex items-center justify-center shrink-0 mt-0.5">
                      <ActivityIcon action={a.action} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">
                        <span className="font-medium">{a.user?.name || "System"}</span>{" "}
                        <span className="text-muted-foreground">{formatAction(a.action)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeTime(a.created)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Panel>

        {/* Account Health */}
        <Panel
          className="lg:col-span-2"
          title="Account Health"
          subtitle={`${connectedAccounts} connected`}
          action={
            <button
              onClick={() => setView("accounts")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Manage
              <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          {accounts.length === 0 ? (
            <EmptyStateInline
              icon={Link2}
              title="No social accounts connected"
              description="Connect your first account to start publishing and analyzing performance."
            />
          ) : (
            <div className="space-y-2.5">
              {accounts.map((acc) => {
                const meta = platformMeta[acc.platform as keyof typeof platformMeta];
                return (
                  <div key={acc.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg border border-border bg-background/40 flex items-center justify-center text-[10px] font-medium shrink-0">
                      {meta?.glyph ?? "AC"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">{acc.displayName}</div>
                        <span className="text-[10px] text-muted-foreground truncate">{acc.username}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {meta?.name ?? acc.platform} · {acc.followers.toLocaleString()} followers
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 w-32">
                      <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            acc.health > 80 ? "bg-white" : acc.health > 50 ? "bg-amber-400" : "bg-red-400",
                          )}
                          style={{ width: `${acc.health}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{acc.health}%</span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border shrink-0 capitalize",
                        acc.status === "connected" && "border-white/20 bg-white/5 text-white/80",
                        acc.status === "expired" && "border-amber-400/30 bg-amber-400/10 text-amber-400",
                        acc.status === "error" && "border-red-400/30 bg-red-400/10 text-red-400",
                        acc.status === "disconnected" && "border-border bg-background/40 text-muted-foreground",
                      )}
                    >
                      {acc.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Automation Status */}
        <Panel
          title="Automation Status"
          subtitle={`${activeAutomations} active`}
          action={
            <button
              onClick={() => setView("automations")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          {automations.length === 0 ? (
            <EmptyStateInline
              icon={Zap}
              title="No automations yet"
              description="Create your first automation to start engaging with content automatically."
            />
          ) : (
            <div className="space-y-3">
              <AutomationStatusRow icon={Zap} label="ACTIVE" count={activeAutomations} tone="active" sub="automations running" />
              <AutomationStatusRow icon={Pause} label="PAUSED" count={pausedAutomations} tone="paused" sub="automations" />
              <AutomationStatusRow icon={XCircle} label="FAILED" count={failedAutomations} tone="failed" sub="automations" />
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] text-muted-foreground mb-2">Recent runs</div>
                {automations.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        a.status === "active" && "bg-white",
                        a.status === "paused" && "bg-amber-400",
                        a.status === "failed" && "bg-red-400",
                        a.status === "draft" && "bg-muted-foreground",
                      )}
                    />
                    <div className="flex-1 text-[11px] truncate">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {a.lastExecution ? formatRelativeTime(a.lastExecution) : "never"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function statusDotColor(status: string): string {
  return {
    scheduled: "bg-white/40",
    queued: "bg-amber-400/60",
    processing: "bg-blue-400/60 animate-pulse",
    published: "bg-green-400/60",
    failed: "bg-red-400/60",
    retrying: "bg-orange-400/60",
    cancelled: "bg-white/20",
    draft: "bg-white/20",
    pending_approval: "bg-amber-400/60",
  }[status] || "bg-white/20";
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes("created") || action.includes("post.")) return <FileText className="h-3 w-3 text-white/70" />;
  if (action.includes("automation")) return <Zap className="h-3 w-3 text-white/70" />;
  if (action.includes("connect")) return <Link2 className="h-3 w-3 text-white/70" />;
  if (action.includes("generate")) return <Sparkles className="h-3 w-3 text-white/70" />;
  if (action.includes("fail") || action.includes("error")) return <AlertTriangle className="h-3 w-3 text-amber-400" />;
  return <CheckCircle2 className="h-3 w-3 text-white/70" />;
}

function formatAction(action: string): string {
  // Convert "post.created" → "created a post"
  const [entity, verb] = action.split(".");
  const verbs: Record<string, string> = {
    created: "created a",
    updated: "updated a",
    deleted: "deleted a",
    published: "published a",
    scheduled: "scheduled a",
    failed: "had a failure on a",
    connected: "connected a",
    disconnected: "disconnected a",
    generated: "generated content for a",
  };
  return `${verbs[verb] || verb} ${entity}`;
}

function formatRelativeTime(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}


function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/40 p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AutomationStatusRow({
  icon: Icon,
  label,
  count,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  sub: string;
  tone: "active" | "paused" | "failed";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          tone === "active" && "bg-white text-black",
          tone === "paused" && "bg-amber-400/10 text-amber-400",
          tone === "failed" && "bg-red-400/10 text-red-400",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] text-muted-foreground font-mono">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{count}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

// ============================================================
// Live Status Ticker
// ============================================================

function LiveStatusTicker({
  connectedAccounts,
  activeAutomations,
  failedAutomations,
}: {
  connectedAccounts: number;
  activeAutomations: number;
  failedAutomations: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pushToast = useStore((s) => s.pushToast);
  const refetch = () => {
    // Force refresh all React Query queries by re-mounting (simple approach)
    pushToast({ type: "info", title: "Status refreshed", description: "Latest data fetched." });
    window.location.reload();
  };

  const operational = failedAutomations === 0;
  const statusText = operational
    ? "All systems operational"
    : `${failedAutomations} automation${failedAutomations > 1 ? "s" : ""} need attention`;

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-card/70 transition-colors text-left"
      >
        <span className={cn(
          "relative flex h-2 w-2 shrink-0",
          operational ? "" : "",
        )}>
          <span className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            operational ? "bg-white" : "bg-amber-400",
          )} />
          <span className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            operational ? "bg-white" : "bg-amber-400",
          )} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">{statusText}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {connectedAccounts} accounts connected · {activeAutomations} automations running
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          <span className="inline-flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            Real-time
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              operational ? "bg-green-400 animate-pulse" : "bg-amber-400",
            )} />
            Connected
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={refetch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
