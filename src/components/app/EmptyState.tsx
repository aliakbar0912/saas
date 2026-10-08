"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const padding = size === "lg" ? "py-20" : size === "sm" ? "py-10" : "py-16";
  const iconSize = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const iconInner = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-xl border border-border bg-card/40 text-center flex flex-col items-center",
        padding,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-xl border border-border bg-background/40 flex items-center justify-center mx-auto mb-4",
          iconSize,
        )}
      >
        <Icon className={cn("text-muted-foreground", iconInner)} />
      </div>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-[11px] text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed text-pretty">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border h-9 px-4 text-xs hover:bg-accent transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Variant for inline / compact empty states (e.g. inside a panel)
export function EmptyStateInline({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("py-8 text-center", className)}>
      <Icon className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
      <div className="text-xs font-medium">{title}</div>
      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
