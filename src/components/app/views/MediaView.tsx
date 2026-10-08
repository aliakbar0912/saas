"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Search,
  Image as ImageIcon,
  Video,
  Music,
  Sparkles,
  Trash2,
  Loader2,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useMedia, useUploadMedia, useDeleteMedia } from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";
import { LoadingState } from "../LoadingState";

type Tab = "all" | "image" | "video" | "audio" | "generated" | "uploaded";

export function MediaView() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pushToast = useStore((s) => s.pushToast);

  const mediaQuery = useMedia({
    type: tab === "all" || tab === "uploaded" ? undefined : tab,
    q: query || undefined,
  });
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();

  const media = mediaQuery.data?.items ?? [];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: media.length },
    { id: "image", label: "Images", count: media.filter((m) => m.type === "image").length },
    { id: "video", label: "Videos", count: media.filter((m) => m.type === "video").length },
    { id: "audio", label: "Audio", count: media.filter((m) => m.type === "audio").length },
    { id: "generated", label: "Generated", count: media.filter((m) => m.type === "generated").length },
    { id: "uploaded", label: "Uploaded", count: media.filter((m) => m.type !== "generated").length },
  ];

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync({
          file,
          name: file.name,
          type: inferType(file.type),
        });
      } catch (err) {
        const e = err as Error;
        setUploadError(e.message);
        pushToast({ type: "error", title: "Upload failed", description: e.message });
      }
    }
    if (!uploadError) {
      pushToast({
        type: "success",
        title: "Upload complete",
        description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded.`,
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      pushToast({ type: "warning", title: "Media deleted", description: `"${name}" was removed.` });
      setSelected((prev) => prev.filter((s) => s !== id));
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Delete failed", description: e.message });
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selected.length} file${selected.length > 1 ? "s" : ""}?`)) return;
    for (const id of selected) {
      const m = media.find((x) => x.id === id);
      if (m) await handleDelete(id, m.name);
    }
  };

  if (mediaQuery.isLoading) return <LoadingState label="Loading media..." />;
  if (mediaQuery.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load media"
        description={(mediaQuery.error as Error)?.message}
        action={{ label: "Retry", onClick: () => mediaQuery.refetch() }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 h-9 px-3 flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search media..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border h-9 px-3 text-xs hover:bg-accent transition-colors">
            <Filter className="h-3 w-3" /> Filter
          </button>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">{selected.length} selected</span>
              <button
                onClick={handleDeleteSelected}
                className="h-8 w-8 rounded-md border border-red-400/30 text-red-400 flex items-center justify-center hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            accept="image/*,video/*,audio/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-3 text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-400/30 bg-red-400/[0.05] p-3 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-[11px] text-red-300 leading-relaxed">{uploadError}</span>
        </div>
      )}

      <div className="inline-flex items-center gap-1 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 h-7 text-[11px] border transition-colors",
              tab === t.id
                ? "border-white bg-white text-black"
                : "border-border bg-background/40 text-muted-foreground hover:bg-card",
            )}
          >
            {t.label}
            <span className={cn("text-[9px] font-mono", tab === t.id ? "text-black/60" : "text-muted-foreground")}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media uploaded yet."
          description="Upload images, videos, or audio to use in your posts. Files are stored securely and linked to your workspace."
          action={{ label: "Upload your first file", onClick: () => fileInputRef.current?.click() }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map((m, i) => {
            const isSelected = selected.includes(m.id);
            const Icon = m.type === "video" ? Video : m.type === "audio" ? Music : m.type === "generated" ? Sparkles : ImageIcon;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: (i % 10) * 0.04 }}
                className={cn(
                  "group relative aspect-square rounded-lg border bg-card/60 cursor-pointer overflow-hidden transition-colors",
                  isSelected ? "border-white" : "border-border hover:border-white/30",
                )}
                onClick={() => {
                  setSelected((prev) => prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]);
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card/40 to-background">
                  {m.url ? (
                    <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                <div className="absolute top-2 left-2">
                  <span className="rounded-md bg-black/60 backdrop-blur px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                    {m.type === "generated" ? "AI" : m.type}
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-white flex items-center justify-center">
                    <span className="text-black text-[10px]">✓</span>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.id, m.name);
                  }}
                  className="absolute top-2 right-2 h-5 w-5 rounded-md bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400"
                >
                  {!isSelected && <Trash2 className="h-3 w-3" />}
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="text-[10px] font-medium truncate">{m.name}</div>
                  <div className="text-[9px] text-muted-foreground">{formatSize(m.size)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function inferType(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
