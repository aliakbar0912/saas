"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Shield,
  Zap,
  Filter,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useComments } from "@/lib/hooks/api";
import { platformMeta } from "@/lib/platforms";
import { EmptyState, EmptyStateInline } from "../EmptyState";
import { LoadingState, PanelSkeleton } from "../LoadingState";

export function EngagementView() {
  const [tab, setTab] = useState<"rules" | "comments" | "workflow">("rules");

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-lg border border-border bg-card/40 p-0.5 text-xs">
        {[
          { id: "rules", label: "Automation Rules", icon: Shield },
          { id: "comments", label: "Comment History", icon: MessageSquare },
          { id: "workflow", label: "Smart Comment AI", icon: Bot },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors",
              tab === t.id ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rules" && <RulesTab />}
      {tab === "comments" && <CommentsTab />}
      {tab === "workflow" && <WorkflowTab />}
    </div>
  );
}

function RulesTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Today&apos;s Engagement Usage</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">0 of 50 daily actions used</p>
            </div>
            <span className="text-2xl font-semibold tabular-nums">0<span className="text-muted-foreground text-sm">/50</span></span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "0%" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
            <div>
              <div className="text-muted-foreground">Comments</div>
              <div className="font-medium mt-0.5">0 / 25</div>
            </div>
            <div>
              <div className="text-muted-foreground">Replies</div>
              <div className="font-medium mt-0.5">0 / 20</div>
            </div>
            <div>
              <div className="text-muted-foreground">Mentions</div>
              <div className="font-medium mt-0.5">0 / 5</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Comment Automation Rules</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Configure safety limits and behavior</p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors">
              <Filter className="h-3 w-3" />
              Add rule
            </button>
          </div>

          <div className="space-y-3">
            {[
              { label: "Maximum actions / day", value: "50", type: "limit" },
              { label: "Maximum comments / hour", value: "10", type: "limit" },
              { label: "Minimum delay between actions", value: "45 seconds", type: "limit" },
              { label: "AI confidence threshold", value: "85%", type: "threshold" },
            ].map((rule) => (
              <div key={rule.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <div className="text-xs font-medium">{rule.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {rule.type === "limit" ? "Hard cap — automation pauses if exceeded" : "Below this, action requires manual approval"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{rule.value}</span>
                  <button className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors">
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-4">Allowed Platforms</h3>
          <div className="space-y-2">
            {["Instagram", "TikTok", "LinkedIn", "X", "YouTube", "Facebook"].map((p, i) => (
              <div key={p} className="flex items-center justify-between py-1">
                <span className="text-xs">{p}</span>
                <div className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  i < 4 ? "bg-white" : "bg-white/10",
                )}>
                  <div className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform",
                    i < 4 ? "translate-x-4" : "translate-x-0.5",
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-3">Blocked Keywords</h3>
          <p className="text-[10px] text-muted-foreground mb-3">AI will never engage with content containing these terms</p>
          <div className="flex flex-wrap gap-1.5">
            {["spam", "scam", "giveaway follow", "free followers"].map((k) => (
              <span key={k} className="rounded-md border border-red-400/20 bg-red-400/5 text-red-400/80 px-2 py-0.5 text-[10px] font-mono">
                {k}
              </span>
            ))}
          </div>
          <button className="mt-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            + Add keyword
          </button>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium">Approval required for high-stakes</div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Comments on posts with over 10k views require manual approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentsTab() {
  const commentsQuery = useComments();
  const comments = commentsQuery.data?.items ?? [];

  if (commentsQuery.isLoading) return <LoadingState label="Loading comments..." />;
  if (commentsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load comments"
        description={(commentsQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => commentsQuery.refetch() }}
      />
    );
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No engagement activity yet."
        description="Once your connected accounts start receiving comments on published posts, the AI will analyze them and generate contextual replies here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((thread) => {
        const meta = thread.platform ? platformMeta[thread.platform as keyof typeof platformMeta] : null;
        return (
          <div key={thread.id} className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-md border border-border bg-card/60 flex items-center justify-center text-[9px] font-medium">
                {meta?.glyph ?? "AC"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{thread.postTitle || "Untitled post"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {(meta?.name ?? thread.platform)} · {thread.receivedAt ? new Date(thread.receivedAt).toLocaleString() : "—"}
                </div>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border capitalize",
                thread.status === "auto" && "border-white/20 bg-white/5 text-white/80",
                thread.status === "approved" && "border-green-400/30 bg-green-400/10 text-green-400",
                thread.status === "queued" && "border-amber-400/30 bg-amber-400/10 text-amber-400",
                thread.status === "new" && "border-blue-400/30 bg-blue-400/10 text-blue-400",
                thread.status === "rejected" && "border-red-400/30 bg-red-400/10 text-red-400",
                thread.status === "published" && "border-green-400/30 bg-green-400/10 text-green-400",
              )}>
                {thread.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">
                    {thread.author?.charAt(1) || "?"}
                  </div>
                  <span className="text-xs font-medium">{thread.author}</span>
                  <span className="text-[10px] text-muted-foreground">original comment</span>
                </div>
                <p className="text-xs leading-relaxed text-pretty">{thread.content}</p>
              </div>

              {thread.aiReply && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center">
                      <Bot className="h-3 w-3 text-black" />
                    </div>
                    <span className="text-xs font-medium">Nexus AI</span>
                    <span className="text-[10px] text-muted-foreground">generated reply</span>
                    <span className="ml-auto text-[10px] text-white/60 inline-flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      {Math.round((thread.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-pretty">{thread.aiReply}</p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors">
                <Edit3 className="h-3 w-3" /> Edit
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors">
                <Eye className="h-3 w-3" /> View thread
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkflowTab() {
  const steps = [
    { label: "Content detected", desc: "New post or comment matching your filters is found on a connected platform", icon: Eye },
    { label: "Analyze content", desc: "AI reads the full thread, identifies intent, sentiment, and key entities", icon: Sparkles },
    { label: "Determine relevance", desc: "System checks if the content matches your allowed topics and confidence threshold", icon: Filter },
    { label: "Generate comment", desc: "AI drafts a contextual reply in your brand voice, adapted to platform conventions", icon: Bot },
    { label: "Safety / spam check", desc: "Reply is checked against platform policies, blocked keywords, and your custom rules", icon: Shield },
    { label: "Rate-limit check", desc: "Verify daily/hourly caps, minimum delays, and per-platform quotas", icon: Clock },
    { label: "Approval if required", desc: "If confidence is below threshold or post is high-stakes, route to approval queue", icon: CheckCircle2 },
    { label: "Publish through official API", desc: "Reply is posted via the platform's official API with full audit trail", icon: Zap },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-2">Smart Comment AI Workflow</h3>
          <p className="text-[11px] text-muted-foreground mb-6">Every automated comment passes through this 8-stage pipeline before publishing</p>

          <div className="space-y-2">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-9 w-9 rounded-full border border-border bg-background/40 flex items-center justify-center shrink-0">
                      <s.icon className="h-4 w-4" />
                    </div>
                    {i < steps.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <div className="text-sm font-medium">{s.label}</div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-medium mb-3">Stats (last 7 days)</h3>
          <div className="space-y-3">
            {[
              { label: "Comments analyzed", value: "0", trend: "—" },
              { label: "Replies generated", value: "0", trend: "—" },
              { label: "Auto-published", value: "0", trend: "—" },
              { label: "Required approval", value: "0", trend: "—" },
              { label: "Rejected by safety", value: "0", trend: "—" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-lg font-semibold mt-0.5 tabular-nums">{s.value}</div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{s.trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
