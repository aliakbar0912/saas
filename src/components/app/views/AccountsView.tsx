"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Check,
  X,
  Activity,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useSocialAccounts, useDisconnectAccount } from "@/lib/hooks/api";
import { platformList, platformMeta } from "@/lib/platforms";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

export function AccountsView() {
  const pushToast = useStore((s) => s.pushToast);
  const accountsQuery = useSocialAccounts();
  const disconnectMutation = useDisconnectAccount();

  const accounts = accountsQuery.data?.items ?? [];
  const connected = accounts.filter((a) => a.status === "connected").length;

  const handleConnect = (platform: string) => {
    // Show a brief toast explaining the OAuth flow
    const platformName = platformMeta[platform as keyof typeof platformMeta]?.name || platform;
    pushToast({
      type: "info",
      title: `Connecting ${platformName}...`,
      description: platform === "instagram"
        ? "You'll be redirected to Meta to authorize your Instagram Business account."
        : `You'll be redirected to ${platformName} to authorize your account.`,
    });
    // Small delay so user sees the toast before redirect
    setTimeout(() => {
      window.location.assign(`/api/social/${platform}/connect`);
    }, 300);
  };

  const handleDisconnect = async (id: string, platform: string, username: string) => {
    if (!confirm(`Disconnect ${username} from ${platform}? You can reconnect anytime.`)) return;
    try {
      await disconnectMutation.mutateAsync({ id, platform });
      pushToast({
        type: "info",
        title: "Account disconnected",
        description: `${username} has been disconnected.`,
      });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Disconnect failed", description: e.message });
    }
  };

  if (accountsQuery.isLoading) return <LoadingState label="Loading accounts..." />;
  if (accountsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load accounts"
        description={(accountsQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => accountsQuery.refetch() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Connected" value={connected} icon={Check} tone="active" />
        <SummaryCard label="Needs attention" value={accounts.filter((a) => a.status === "expired" || a.status === "error").length} icon={AlertTriangle} tone="warning" />
        <SummaryCard label="Disconnected" value={accounts.filter((a) => a.status === "disconnected").length} icon={X} tone="failed" />
        <SummaryCard label="Total followers" value={accounts.reduce((s, a) => s + (a.followers || 0), 0).toLocaleString()} icon={Activity} tone="neutral" />
      </div>

      {/* Connected accounts */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Connect your first social account."
          description="Click any platform below to start the official OAuth authorization flow. Your tokens are encrypted and stored securely — they never reach the browser."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((acc, i) => {
            const meta = platformMeta[acc.platform as keyof typeof platformMeta];
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card/40 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl border border-border bg-background/40 flex items-center justify-center text-sm font-medium">
                      {meta?.glyph ?? "AC"}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{acc.displayName || acc.username}</div>
                      <div className="text-[11px] text-muted-foreground">{acc.username}</div>
                    </div>
                  </div>
                  <StatusBadge status={acc.status} />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Stat label="Followers" value={acc.followers > 0 ? acc.followers.toLocaleString() : "—"} />
                  <Stat label="Last sync" value={acc.lastSync ? new Date(acc.lastSync).toLocaleDateString() : "—"} />
                  <Stat label="Health" value={`${acc.health || 0}%`} />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Account health</span>
                    <span className="font-mono">{acc.health || 0}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        (acc.health || 0) > 80 ? "bg-white" : (acc.health || 0) > 50 ? "bg-amber-400" : "bg-red-400",
                      )}
                      style={{ width: `${acc.health || 0}%` }}
                    />
                  </div>
                </div>

                {acc.permissions && acc.permissions.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] text-muted-foreground mb-1.5">Permissions</div>
                    <div className="flex flex-wrap gap-1">
                      {acc.permissions.slice(0, 4).map((p) => (
                        <span key={p} className="rounded-md border border-border bg-background/40 px-1.5 py-0.5 text-[9px]">
                          {p}
                        </span>
                      ))}
                      {acc.permissions.length > 4 && (
                        <span className="text-[9px] text-muted-foreground">+{acc.permissions.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  {acc.status === "connected" && (
                    <button
                      onClick={() => handleConnect(acc.platform)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" /> Reconnect
                    </button>
                  )}
                  <button
                    onClick={() => handleDisconnect(acc.id, acc.platform, acc.username)}
                    disabled={disconnectMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 text-red-400 h-8 px-3 text-xs hover:bg-red-400/10 transition-colors disabled:opacity-60"
                  >
                    {disconnectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    Disconnect
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Available platforms */}
      <div className="rounded-xl border border-border bg-card/40 p-5">
        <h3 className="text-sm font-medium mb-1">Available platforms</h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          Click a platform to start the official OAuth authorization flow. Tokens are encrypted and never exposed to the browser.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {platformList.map((p) => {
            const meta = platformMeta[p];
            const isConnected = accounts.some((a) => a.platform === p && a.status === "connected");
            return (
              <button
                key={p}
                onClick={() => handleConnect(p)}
                disabled={isConnected}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  isConnected
                    ? "border-border bg-background/30 opacity-50 cursor-not-allowed"
                    : "border-border bg-background/40 hover:bg-card hover:border-white/20",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg border border-border bg-card/60 flex items-center justify-center text-[10px] font-medium">
                    {meta.glyph}
                  </div>
                  {isConnected ? (
                    <Check className="h-3 w-3 text-white/60" />
                  ) : (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs font-medium">{meta.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {isConnected ? "Connected" : "Click to connect"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, icon: Icon, tone,
}: {
  label: string; value: number | string; icon: React.ComponentType<{ className?: string }>;
  tone: "active" | "warning" | "failed" | "neutral";
}) {
  const colors = {
    active: "bg-white text-black",
    warning: "bg-amber-400/10 text-amber-400",
    failed: "bg-red-400/10 text-red-400",
    neutral: "bg-background/40 text-muted-foreground",
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    connected: "border-white/20 bg-white/5 text-white",
    expired: "border-amber-400/30 bg-amber-400/10 text-amber-400",
    error: "border-red-400/30 bg-red-400/10 text-red-400",
    disconnected: "border-border bg-background/40 text-muted-foreground",
  };
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border capitalize", colors[status as keyof typeof colors] || colors.disconnected)}>
      {status}
    </span>
  );
}
