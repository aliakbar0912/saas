"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-12 text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function PanelSkeleton({
  className,
  lines = 4,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/40 p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
          <div className="h-2 w-32 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="h-6 w-6 rounded-md bg-white/5 animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
            className="h-7 w-full bg-white/[0.04] rounded"
          />
        ))}
      </div>
    </div>
  );
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/40 p-4", className)}>
      <div className="h-8 w-8 rounded-lg border border-border bg-background/40 mb-2 animate-pulse" />
      <div className="h-6 w-16 bg-white/5 rounded animate-pulse mb-1" />
      <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
    </div>
  );
}
