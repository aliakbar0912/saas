"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit3,
  Copy,
  Calendar as CalendarIcon,
  Trash2,
  Send,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { platformMeta } from "@/lib/platforms";
import { useStore } from "@/lib/store";
import {
  usePosts,
  useUpdatePost,
  useDeletePost,
  usePublishPost,
  useSchedulePost,
} from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

type ViewMode = "Month" | "Week" | "Day" | "Queue";

interface CalPost {
  id: string;
  day: number;
  month: number;
  hour?: number;
  platform: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  type: string;
  socialAccount?: { username: string } | null;
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 8 AM to 7 PM

export function CalendarView() {
  const [mode, setMode] = useState<ViewMode>("Month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const setView = useStore((s) => s.setView);

  const monthLabel = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const postsQuery = usePosts();
  const posts = postsQuery.data?.items ?? [];

  // Convert API posts to calendar shape
  const calPosts: CalPost[] = useMemo(() => {
    return posts
      .filter((p) => p.scheduledAt)
      .map((p) => {
        const d = new Date(p.scheduledAt!);
        return {
          id: p.id,
          day: d.getDate(),
          month: d.getMonth(),
          hour: d.getHours(),
          platform: p.platform,
          title: p.title,
          status: p.status,
          scheduledAt: p.scheduledAt,
          type: p.type,
          socialAccount: p.socialAccount,
        };
      });
  }, [posts]);

  const goPrev = () => {
    const d = new Date(currentDate);
    if (mode === "Month") d.setMonth(d.getMonth() - 1);
    else if (mode === "Week") d.setDate(d.getDate() - 7);
    else if (mode === "Day") d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (mode === "Month") d.setMonth(d.getMonth() + 1);
    else if (mode === "Week") d.setDate(d.getDate() + 7);
    else if (mode === "Day") d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  if (postsQuery.isLoading) return <LoadingState label="Loading calendar..." />;
  if (postsQuery.isError) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Failed to load calendar"
        description={(postsQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => postsQuery.refetch() }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-medium min-w-[140px] text-center">{monthLabel}</h3>
          <button
            onClick={goNext}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border bg-background/40 p-0.5 text-xs">
            {(["Month", "Week", "Day", "Queue"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors",
                  mode === m ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => setView("create")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-8 px-3 text-xs font-medium hover:bg-white/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New post
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-[10px] text-muted-foreground">Filter by:</span>
        {["All platforms", ...Object.keys(platformMeta).slice(0, 5)].map((f, i) => (
          <button
            key={f}
            className={cn(
              "rounded-md px-2.5 h-6 text-[11px] border transition-colors",
              i === 0
                ? "border-white bg-white text-black"
                : "border-border bg-background/40 text-muted-foreground hover:bg-card",
            )}
          >
            {f === "All platforms" ? "All platforms" : platformMeta[f as keyof typeof platformMeta].name}
          </button>
        ))}
      </div>

      {calPosts.length === 0 && (
        <EmptyState
          icon={CalendarIcon}
          title="Your publishing calendar is empty."
          description="Create a post and schedule it to see it appear on your calendar. Drag and drop to reschedule."
          action={{ label: "Create your first post", onClick: () => setView("create") }}
          className="mb-5"
        />
      )}

      {mode === "Month" && (
        <MonthView
          currentDate={currentDate}
          posts={calPosts}
          onSelectPost={setSelectedPostId}
        />
      )}
      {mode === "Week" && <WeekView currentDate={currentDate} posts={calPosts} onSelectPost={setSelectedPostId} />}
      {mode === "Day" && <DayView currentDate={currentDate} posts={calPosts} onSelectPost={setSelectedPostId} />}
      {mode === "Queue" && <QueueView posts={calPosts} onSelectPost={setSelectedPostId} />}

      <PostDetailModal
        postId={selectedPostId}
        posts={posts}
        onClose={() => setSelectedPostId(null)}
      />
    </div>
  );
}

function MonthView({
  currentDate,
  posts,
  onSelectPost,
}: {
  currentDate: Date;
  posts: CalPost[];
  onSelectPost: (id: string) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return { day: 0, inMonth: false };
    return { day: dayNum, inMonth: true };
  });

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {cells.map((cell, i) => {
          const dayPosts = cell.inMonth
            ? posts.filter((p) => p.day === cell.day && p.month === month)
            : [];
          return (
            <div
              key={i}
              className={cn(
                "bg-card/60 min-h-[100px] p-1.5 hover:bg-card transition-colors",
                !cell.inMonth && "opacity-30",
              )}
            >
              <div className="text-[10px] text-muted-foreground mb-1 px-1">
                {cell.day > 0 ? cell.day : ""}
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((p) => {
                  const meta = platformMeta[p.platform as keyof typeof platformMeta];
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPost(p.id)}
                      className="w-full text-left rounded-md border border-border bg-background/60 p-1.5 cursor-pointer hover:bg-card hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-medium">{meta?.glyph ?? "PS"}</span>
                        {p.hour !== undefined && (
                          <span className="text-[9px] text-muted-foreground">{p.hour}:00</span>
                        )}
                      </div>
                      <div className="text-[10px] truncate mt-0.5">{p.title}</div>
                    </button>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  posts,
  onSelectPost,
}: {
  currentDate: Date;
  posts: CalPost[];
  onSelectPost: (id: string) => void;
}) {
  // Calculate the Monday of the current week
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px mb-2">
          <div />
          {weekDays.map((d, i) => (
            <div key={d} className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{d}</div>
              <div className={cn("text-lg font-medium mt-1", weekDates[i].toDateString() === new Date().toDateString() && "text-white")}>
                {weekDates[i].getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
          {hours.map((h) => (
            <div key={h} className="contents">
              <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 font-mono">
                {h}:00
              </div>
              {weekDates.map((date, dayIdx) => {
                const dayPosts = posts.filter(
                  (p) => p.day === date.getDate() && p.month === date.getMonth() && p.hour === h,
                );
                return (
                  <div
                    key={dayIdx}
                    className="min-h-[48px] rounded-md border border-border/60 bg-background/30 hover:bg-card/40 transition-colors p-1"
                  >
                    {dayPosts.map((p) => {
                      const meta = platformMeta[p.platform as keyof typeof platformMeta];
                      return (
                        <motion.button
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => onSelectPost(p.id)}
                          className="w-full text-left rounded border border-border bg-card p-1.5 mb-1 cursor-pointer hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-medium">{meta?.glyph ?? "PS"}</span>
                          </div>
                          <div className="text-[10px] truncate">{p.title}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  posts,
  onSelectPost,
}: {
  currentDate: Date;
  posts: CalPost[];
  onSelectPost: (id: string) => void;
}) {
  const dayPosts = posts.filter(
    (p) => p.day === currentDate.getDate() && p.month === currentDate.getMonth(),
  );

  return (
    <div className="space-y-1 max-w-2xl">
      {hours.map((h) => {
        const slotPosts = dayPosts.filter((p) => p.hour === h);
        return (
          <div key={h} className="flex gap-3 min-h-[60px] border-b border-border/60 pb-2">
            <div className="w-14 text-[10px] text-muted-foreground font-mono pt-1">{h}:00</div>
            <div className="flex-1">
              {slotPosts.length === 0 ? (
                <button className="w-full h-full text-[10px] text-muted-foreground/40 hover:text-muted-foreground text-left opacity-0 hover:opacity-100 transition-opacity">
                  + Schedule at {h}:00
                </button>
              ) : (
                slotPosts.map((p) => {
                  const meta = platformMeta[p.platform as keyof typeof platformMeta];
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPost(p.id)}
                      className="w-full text-left rounded-lg border border-border bg-background/40 p-3 hover:bg-card transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-md border border-border bg-card/60 flex items-center justify-center text-[9px] font-medium">
                          {meta?.glyph ?? "PS"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.title}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {meta?.name ?? p.platform} · {h}:00
                          </div>
                        </div>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          p.status === "published" && "bg-green-400",
                          p.status === "scheduled" && "bg-white/60",
                          p.status === "queued" && "bg-amber-400",
                          p.status === "processing" && "bg-blue-400 animate-pulse",
                          p.status === "failed" && "bg-red-400",
                        )} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueueView({
  posts,
  onSelectPost,
}: {
  posts: CalPost[];
  onSelectPost: (id: string) => void;
}) {
  const queued = posts
    .filter((p) => p.status === "queued" || p.status === "scheduled")
    .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  return (
    <div className="space-y-2 max-w-2xl">
      <div className="text-[11px] text-muted-foreground mb-4">
        {queued.length} posts in queue
      </div>
      {queued.map((p) => {
        const meta = platformMeta[p.platform as keyof typeof platformMeta];
        const d = p.scheduledAt ? new Date(p.scheduledAt) : null;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPost(p.id)}
            className="w-full flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 hover:bg-card transition-colors text-left"
          >
            <div className="text-[10px] font-mono text-muted-foreground w-16">
              {d ? d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
            </div>
            <div className="h-10 w-10 rounded-lg border border-border bg-card/60 flex items-center justify-center text-[10px] font-medium shrink-0">
              {meta?.glyph ?? "PS"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {meta?.name ?? p.platform} {p.socialAccount?.username ? `· ${p.socialAccount.username}` : ""}
              </div>
            </div>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border capitalize",
              p.status === "scheduled" && "border-white/20 bg-white/5 text-white/80",
              p.status === "queued" && "border-amber-400/30 bg-amber-400/10 text-amber-400",
            )}>
              {p.status}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Post Detail Modal — Edit / Duplicate / Reschedule / Cancel / Publish
// ============================================================

function PostDetailModal({
  postId,
  posts,
  onClose,
}: {
  postId: string | null;
  posts: { id: string; title: string; caption: string; platform: string; type: string; scheduledAt: string | null; status: string; socialAccount?: { username: string } | null }[];
  onClose: () => void;
}) {
  const post = posts.find((p) => p.id === postId);
  const pushToast = useStore((s) => s.pushToast);
  const updateMutation = useUpdatePost();
  const deleteMutation = useDeletePost();
  const publishMutation = usePublishPost();
  const scheduleMutation = useSchedulePost();

  const handleEdit = async () => {
    if (!post) return;
    const newTitle = prompt("Edit title:", post.title);
    if (newTitle === null) return;
    try {
      await updateMutation.mutateAsync({ id: post.id, title: newTitle });
      pushToast({ type: "success", title: "Post updated", description: "Title saved." });
      onClose();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Update failed", description: e.message });
    }
  };

  const handleReschedule = async () => {
    if (!post) return;
    const newDate = prompt("New date/time (YYYY-MM-DDTHH:MM):", "");
    if (!newDate) return;
    try {
      await scheduleMutation.mutateAsync({ postId: post.id, scheduledAt: newDate });
      pushToast({ type: "success", title: "Rescheduled", description: `Post moved to ${newDate}.` });
      onClose();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Reschedule failed", description: e.message });
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(post.id);
      pushToast({ type: "warning", title: "Post cancelled", description: "Removed from queue." });
      onClose();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Delete failed", description: e.message });
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    try {
      await publishMutation.mutateAsync(post.id);
      pushToast({
        type: "success",
        title: "Publishing now",
        description: `"${post.title}" is being published.`,
      });
      onClose();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Publish failed", description: e.message });
    }
  };

  return (
    <AnimatePresence>
      {post && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg border border-border bg-background/40 flex items-center justify-center text-[10px] font-medium">
                    {platformMeta[post.platform as keyof typeof platformMeta]?.glyph ?? "PS"}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{platformMeta[post.platform as keyof typeof platformMeta]?.name ?? post.platform}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {post.type} · {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "Not scheduled"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Title</div>
                <div className="text-base font-medium mb-4">{post.title}</div>

                <div className="rounded-lg border border-border bg-background/40 p-3 mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Caption</div>
                  <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {post.caption || "No caption"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="rounded-lg border border-border bg-background/40 p-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        post.status === "published" && "bg-green-400",
                        post.status === "scheduled" && "bg-white/60",
                        post.status === "queued" && "bg-amber-400",
                        post.status === "processing" && "bg-blue-400 animate-pulse",
                        post.status === "failed" && "bg-red-400",
                      )} />
                      <span className="text-xs capitalize">{post.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/40 p-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Account</div>
                    <div className="text-xs mt-1 truncate">{post.socialAccount?.username || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/40 p-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Scheduled</div>
                    <div className="text-xs mt-1 font-mono">
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleEdit}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border h-9 px-3 text-xs hover:bg-accent transition-colors disabled:opacity-60"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleReschedule}
                    disabled={scheduleMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border h-9 px-3 text-xs hover:bg-accent transition-colors disabled:opacity-60"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" /> Reschedule
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 text-red-400 h-9 px-3 text-xs hover:bg-red-400/10 transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
                  >
                    {publishMutation.isPending ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Publish now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
