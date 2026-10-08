"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const toneMap = {
  success: "text-white",
  info: "text-muted-foreground",
  warning: "text-amber-400",
  error: "text-red-400",
};

export function Toaster() {
  const { toasts, dismissToast } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = iconMap[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-3.5 flex items-start gap-3"
            >
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", toneMap[t.type])} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{t.title}</div>
                {t.description && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
