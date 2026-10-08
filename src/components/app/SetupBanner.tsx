"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Terminal, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useSetupStatus, useRunMigration } from "@/lib/hooks/api";

export function SetupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const setupQuery = useSetupStatus();
  const runMigration = useRunMigration();

  if (dismissed) return null;
  if (setupQuery.isLoading || setupQuery.isError) return null;

  const status = setupQuery.data;
  if (!status) return null;
  if (status.missing.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-16 left-0 right-0 z-40 mx-auto max-w-3xl mt-2 px-4"
      >
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] backdrop-blur-xl p-4 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">PocketBase schema setup required</div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {status.missing.length} of {status.total} collections are missing. To enable real data persistence, set <code className="font-mono bg-white/5 px-1 py-0.5 rounded">POCKETBASE_ADMIN_EMAIL</code> and <code className="font-mono bg-white/5 px-1 py-0.5 rounded">POCKETBASE_ADMIN_PASSWORD</code> in your <code className="font-mono bg-white/5 px-1 py-0.5 rounded">.env</code> file (use the credentials you log into the PocketBase admin UI with at <code className="font-mono bg-white/5 px-1 py-0.5 rounded">pocketbase.mughalx.tech/_/</code>), then run <code className="font-mono bg-white/5 px-1 py-0.5 rounded">bun run pb:setup</code> in the terminal.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {status.adminConfigured ? (
                  <button
                    onClick={() => runMigration.mutateAsync()}
                    disabled={runMigration.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-8 px-3 text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
                  >
                    {runMigration.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Terminal className="h-3 w-3" />}
                    {runMigration.isPending ? "Running migration..." : "Run migration now"}
                  </button>
                ) : (
                  <span className="text-[10px] text-amber-400/80">Admin credentials not configured — set them in .env first</span>
                )}
                <button
                  onClick={() => setShowDetails(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors"
                >
                  View details
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                >
                  Dismiss
                </button>
              </div>
              {runMigration.isPending && (
                <div className="mt-3 rounded-md border border-border bg-background/40 p-2 font-mono text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Creating {status.missing.length} collections...
                  </div>
                </div>
              )}
              {runMigration.isSuccess && (
                <div className="mt-3 rounded-md border border-green-400/30 bg-green-400/5 p-2 text-[10px] text-green-400 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Migration complete — refresh the page to load real data.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <DetailsModal status={status} onClose={() => setShowDetails(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DetailsModal({
  status,
  onClose,
}: {
  status: { existing: string[]; missing: string[]; total: number; adminConfigured: boolean };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Schema setup details</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Existing collections ({status.existing.length})</div>
            {status.existing.length === 0 ? (
              <div className="text-xs text-muted-foreground">None</div>
            ) : (
              <div className="space-y-1">
                {status.existing.map((c) => (
                  <div key={c} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Missing collections ({status.missing.length})</div>
            <div className="space-y-1">
              {status.missing.map((c) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded-full border border-amber-400/40" />
                  {c}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Setup instructions</div>
            <ol className="text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
              <li>1. Open <code className="font-mono bg-white/5 px-1 py-0.5 rounded">https://pocketbase.mughalx.tech/_/</code> and log in with your admin account.</li>
              <li>2. In your project <code className="font-mono bg-white/5 px-1 py-0.5 rounded">.env</code> file, set:
                <pre className="mt-1.5 p-2 rounded bg-black/40 text-[10px] overflow-x-auto"><code>{`POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password`}</code></pre>
              </li>
              <li>3. Run <code className="font-mono bg-white/5 px-1 py-0.5 rounded">bun run pb:setup</code> in the terminal. This will create all missing collections idempotently.</li>
              <li>4. Refresh this page — your dashboard will start loading real data.</li>
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
