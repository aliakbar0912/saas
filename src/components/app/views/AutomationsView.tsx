"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Pause,
  XCircle,
  Plus,
  MoreHorizontal,
  Workflow,
  Clock,
  AlertTriangle,
  Play,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  useAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
} from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";
import type { Automation } from "@/lib/hooks/api";

export function AutomationsView() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const pushToast = useStore((s) => s.pushToast);

  const automationsQuery = useAutomations();
  const updateMutation = useUpdateAutomation();
  const deleteMutation = useDeleteAutomation();

  const automations = automationsQuery.data?.items ?? [];
  const active = automations.filter((a) => a.status === "active").length;
  const paused = automations.filter((a) => a.status === "paused").length;
  const failed = automations.filter((a) => a.status === "failed").length;

  const handleToggle = async (a: Automation) => {
    const newStatus = a.status === "active" ? "paused" : "active";
    try {
      await updateMutation.mutateAsync({ id: a.id, status: newStatus });
      pushToast({
        type: newStatus === "active" ? "success" : "info",
        title: newStatus === "active" ? "Automation resumed" : "Automation paused",
        description: `"${a.name}" is now ${newStatus}.`,
      });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Update failed", description: e.message });
    }
  };

  const handleDelete = async (a: Automation) => {
    if (!confirm(`Delete automation "${a.name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(a.id);
      pushToast({ type: "warning", title: "Automation deleted", description: `"${a.name}" was removed.` });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Delete failed", description: e.message });
    }
  };

  if (automationsQuery.isLoading) return <LoadingState label="Loading automations..." />;
  if (automationsQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load automations"
        description={(automationsQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => automationsQuery.refetch() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Active" value={active} icon={Zap} tone="active" />
        <SummaryCard label="Paused" value={paused} icon={Pause} tone="paused" />
        <SummaryCard label="Failed" value={failed} icon={XCircle} tone="failed" />
        <SummaryCard label="Total runs" value={automations.reduce((sum, a) => sum + (a.runCount || 0), 0)} icon={Clock} tone="neutral" sub="all-time" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">All automations</h3>
        <button
          onClick={() => setBuilderOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-3 text-xs font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New automation
        </button>
      </div>

      {automations.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No automations yet"
          description="Build your first automation to engage with content automatically — comments, replies, cross-posting, and more."
          action={{ label: "Create automation", onClick: () => setBuilderOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {automations.map((a) => (
            <AutomationCard
              key={a.id}
              automation={a}
              onToggle={() => handleToggle(a)}
              onDelete={() => handleDelete(a)}
            />
          ))}
        </div>
      )}

      {builderOpen && <AutomationBuilder onClose={() => setBuilderOpen(false)} />}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "active" | "paused" | "failed" | "neutral";
  sub?: string;
}) {
  const colors = {
    active: "bg-white text-black",
    paused: "bg-amber-400/10 text-amber-400",
    failed: "bg-red-400/10 text-red-400",
    neutral: "bg-background/40 text-muted-foreground",
  };
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", colors[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70">{sub}</div>}
    </div>
  );
}

function AutomationCard({
  automation: a,
  onToggle,
  onDelete,
}: {
  automation: Automation;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/40 p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">{a.name}</h3>
            <StatusPill status={a.status} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {(a.runCount || 0).toLocaleString()} runs · last {a.lastExecution ? "recently" : "never"}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="rounded-lg border border-red-400/20 bg-red-400/[0.03] p-3">
              <div className="text-[10px] text-red-400 mb-1">Danger zone</div>
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" /> Delete automation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-lg border border-border bg-background/40 p-3 mb-3">
        <div className="space-y-2">
          <WorkflowStep type="WHEN" label={a.trigger} />
          <div className="ml-4 h-3 w-px bg-border" />
          <div className="space-y-2">
            {Array.isArray(a.actions) && a.actions.length > 0 ? (
              a.actions.map((action, i) => (
                <div key={i}>
                  <WorkflowStep type="THEN" label={typeof action === "string" ? action : (action as { label?: string })?.label || JSON.stringify(action)} />
                  {i < (a.actions as unknown[]).length - 1 && <div className="ml-4 h-3 w-px bg-border" />}
                </div>
              ))
            ) : (
              <div className="text-[10px] text-muted-foreground">No actions configured</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {a.errorCount > 0 ? (
          <span className="text-[10px] text-red-400 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {a.errorCount} error{a.errorCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            No errors
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border h-7 px-2.5 text-[11px] hover:bg-accent transition-colors"
          >
            {a.status === "active" ? (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> Resume
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function WorkflowStep({ type, label }: { type: string; label: string }) {
  const colors = {
    WHEN: "border-white/30 bg-white/5 text-white",
    IF: "border-amber-400/30 bg-amber-400/5 text-amber-400",
    THEN: "border-border bg-background/60 text-muted-foreground",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", colors[type as keyof typeof colors] || colors.THEN)}>
        {type}
      </span>
      <span className="text-xs truncate">{label}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors = {
    active: "border-white/20 bg-white/5 text-white",
    paused: "border-amber-400/30 bg-amber-400/10 text-amber-400",
    failed: "border-red-400/30 bg-red-400/10 text-red-400",
    draft: "border-border bg-background/40 text-muted-foreground",
  };
  return (
    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", colors[status as keyof typeof colors] || colors.draft)}>
      {status}
    </span>
  );
}

function AutomationBuilder({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("New content detected");
  const [actions, setActions] = useState<string[]>(["Generate comment"]);
  const [newAction, setNewAction] = useState("");
  const createMutation = useCreateAutomation();
  const pushToast = useStore((s) => s.pushToast);

  const handleCreate = async () => {
    if (!name.trim()) {
      pushToast({ type: "warning", title: "Name required", description: "Give your automation a name." });
      return;
    }
    if (actions.length === 0) {
      pushToast({ type: "warning", title: "Add an action", description: "Your automation needs at least one action." });
      return;
    }
    try {
      await createMutation.mutateAsync({
        name,
        trigger,
        actions: actions.map((a) => ({ label: a })),
        status: "active",
        rateLimits: { max_per_day: 50, max_per_hour: 10, min_delay_seconds: 45 },
      });
      pushToast({ type: "success", title: "Automation created", description: `"${name}" is now active.` });
      onClose();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Failed to create", description: e.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Workflow className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">New Automation</span>
          </div>
          <h2 className="text-lg font-semibold">Build a workflow</h2>
          <p className="text-xs text-muted-foreground mt-1">Define a trigger and actions. Save to start running.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Topic Engagement"
              className="mt-1 w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30"
            />
          </div>

          <BuilderSection label="WHEN" hint="What starts this automation?">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30"
            >
              <option>New content detected</option>
              <option>Brand mention detected</option>
              <option>Question in comments</option>
              <option>High-performing post detected</option>
              <option>Negative sentiment detected</option>
            </select>
          </BuilderSection>

          <BuilderSection label="THEN" hint="Actions to execute (in order)">
            <div className="space-y-2">
              {actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 h-10">
                  <span className="text-[10px] font-mono text-muted-foreground">{i + 1}</span>
                  <span className="text-xs flex-1">{a}</span>
                  <button
                    onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-red-400 text-xs"
                  >
                    remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newAction.trim()) {
                      setActions((prev) => [...prev, newAction.trim()]);
                      setNewAction("");
                    }
                  }}
                  placeholder="Add an action..."
                  className="flex-1 rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30"
                />
                <button
                  onClick={() => {
                    if (newAction.trim()) {
                      setActions((prev) => [...prev, newAction.trim()]);
                      setNewAction("");
                    }
                  }}
                  className="rounded-lg border border-border h-10 px-3 text-xs hover:bg-accent transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </BuilderSection>
        </div>

        <div className="p-6 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border h-9 px-4 text-xs hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create automation"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BuilderSection({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-border bg-background/60 text-muted-foreground">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      {children}
    </div>
  );
}
