"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  Send,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { platformMeta } from "@/lib/platforms";
import { useStore } from "@/lib/store";
import {
  usePosts,
  useDeletePost,
  usePublishPost,
} from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";
import type { PostStatus } from "@/lib/types";

export function ContentView() {
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const setView = useStore((s) => s.setView);
  const pushToast = useStore((s) => s.pushToast);
  const [showErrorBanner, setShowErrorBanner] = useState(true);

  const postsQuery = usePosts({
    status: filter === "all" ? undefined : filter,
    platform: platformFilter === "all" ? undefined : platformFilter,
    q: query || undefined,
  });
  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();

  const posts = postsQuery.data?.items ?? [];
  const failedPosts = posts.filter((p) => p.status === "failed");
  const showBanner = showErrorBanner && filter === "all" && failedPosts.length > 0;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      pushToast({ type: "success", title: "Post deleted", description: `"${title}" was removed.` });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Delete failed", description: e.message });
    }
  };

  const handlePublish = async (id: string, title: string) => {
    try {
      await publishMutation.mutateAsync(id);
      pushToast({
        type: "success",
        title: "Queued for publishing",
        description: `"${title}" is being published through the official API.`,
      });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Publish failed", description: e.message });
    }
  };

  if (postsQuery.isLoading) {
    return <LoadingState label="Loading posts..." />;
  }

  if (postsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load posts"
        description={(postsQuery.error as Error)?.message || "Something went wrong."}
        action={{ label: "Retry", onClick: () => postsQuery.refetch() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {showBanner && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.03] p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-400/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">Something went wrong while publishing</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {failedPosts.length} post{failedPosts.length > 1 ? "s" : ""} failed to publish. Retry now or review the post.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    failedPosts.forEach((p) => handlePublish(p.id, p.title));
                    setShowErrorBanner(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-8 px-3 text-xs font-medium hover:bg-white/90 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry all
                </button>
                <button
                  onClick={() => setShowErrorBanner(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatPill label="Total" value={String(posts.length)} />
        <StatPill label="Published" value={String(posts.filter((p) => p.status === "published").length)} />
        <StatPill label="Scheduled" value={String(posts.filter((p) => p.status === "scheduled").length)} />
        <StatPill label="Drafts" value={String(posts.filter((p) => p.status === "draft").length)} />
        <StatPill label="Failed" value={String(failedPosts.length)} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 h-9 px-3 flex-1 min-w-[180px] max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="inline-flex items-center rounded-lg border border-border bg-card/40 p-0.5 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "published", label: "Published" },
            { id: "scheduled", label: "Scheduled" },
            { id: "draft", label: "Drafts" },
            { id: "failed", label: "Failed" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as PostStatus | "all")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors",
                filter === f.id ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-lg border border-border bg-card/40 h-9 px-3 text-xs outline-none focus:border-white/30"
        >
          <option value="all">All platforms</option>
          {Object.keys(platformMeta).map((p) => (
            <option key={p} value={p}>
              {platformMeta[p as keyof typeof platformMeta].name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-3 text-xs font-medium hover:bg-white/90 transition-colors ml-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          New post
        </button>
      </div>

      {/* Posts table */}
      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={query || filter !== "all" ? "No posts match your filters" : "No content yet"}
          description={
            query || filter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first AI-powered post to see it appear here."
          }
          action={
            query || filter !== "all"
              ? { label: "Clear filters", onClick: () => { setQuery(""); setFilter("all"); setPlatformFilter("all"); } }
              : { label: "Create post", onClick: () => setView("create") }
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            <div>Post</div>
            <div>Platform</div>
            <div>Scheduled</div>
            <div>Status</div>
            <div>Account</div>
            <div />
          </div>

          <div className="divide-y divide-border">
            {posts.map((post, i) => {
              const meta = platformMeta[post.platform as keyof typeof platformMeta];
              const statusIcon = {
                published: <CheckCircle2 className="h-3 w-3 text-white/70" />,
                scheduled: <Clock className="h-3 w-3 text-muted-foreground" />,
                queued: <Clock className="h-3 w-3 text-amber-400" />,
                processing: <RefreshCw className="h-3 w-3 text-blue-400 animate-spin" />,
                failed: <AlertTriangle className="h-3 w-3 text-red-400" />,
                retrying: <RefreshCw className="h-3 w-3 text-orange-400 animate-spin" />,
                cancelled: <AlertTriangle className="h-3 w-3 text-muted-foreground" />,
                draft: <FileText className="h-3 w-3 text-muted-foreground" />,
                pending_approval: <Clock className="h-3 w-3 text-amber-400" />,
              }[post.status] || <Clock className="h-3 w-3 text-muted-foreground" />;

              const scheduledDisplay = post.scheduledAt
                ? new Date(post.scheduledAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "—";

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-3 px-4 py-3 hover:bg-card/60 transition-colors items-center group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg border border-border bg-card/60 flex items-center justify-center text-[10px] font-medium shrink-0">
                      {meta?.glyph ?? "PS"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{post.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{post.caption || "No caption"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">{meta?.name ?? post.platform}</span>
                    <span className="text-[10px] text-muted-foreground">· {post.type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">{scheduledDisplay}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5">{statusIcon}</span>
                    <span className="text-[11px] capitalize">{post.status.replace(/_/g, " ")}</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground truncate">
                    {post.socialAccount?.username || "—"}
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {(post.status === "draft" || post.status === "failed") && (
                      <button
                        onClick={() => handlePublish(post.id, post.title)}
                        disabled={publishMutation.isPending}
                        title="Publish now"
                        className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      title="View"
                      onClick={() => setView("calendar")}
                      className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      title="Delete"
                      className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}
