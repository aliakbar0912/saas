"use client";

import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Link2,
  BarChart3,
  Workflow,
  Search,
  Settings as SettingsIcon,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  Building2,
  Bot,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { ViewKey } from "@/lib/types";
import { useState } from "react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: "Actions" | "Navigate" | "Create";
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setView, setAssistantOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState("");

  const go = (v: ViewKey) => {
    setView(v);
    setCommandOpen(false);
    setQuery("");
  };

  const items: CommandItem[] = [
    { id: "create-post", label: "Create post", hint: "Open AI Studio", icon: Plus, action: () => go("create"), group: "Create" },
    { id: "create-automation", label: "Create automation", hint: "Build workflow", icon: Workflow, action: () => go("automations"), group: "Create" },
    { id: "connect-account", label: "Connect account", hint: "Add platform", icon: Link2, action: () => go("accounts"), group: "Create" },
    { id: "open-calendar", label: "Open calendar", icon: Calendar, action: () => go("calendar"), group: "Navigate" },
    { id: "view-analytics", label: "View analytics", icon: BarChart3, action: () => go("analytics"), group: "Navigate" },
    { id: "view-approvals", label: "View approval queue", icon: FileText, action: () => go("approvals"), group: "Navigate" },
    { id: "view-usage", label: "View usage", icon: BarChart3, action: () => go("usage"), group: "Navigate" },
    { id: "open-settings", label: "Open settings", icon: SettingsIcon, action: () => go("settings"), group: "Navigate" },
    { id: "open-overview", label: "Go to overview", icon: LayoutDashboard, action: () => go("overview"), group: "Navigate" },
    { id: "open-engagement", label: "Open engagement", icon: MessageSquare, action: () => go("engagement"), group: "Navigate" },
    { id: "open-media", label: "Open media library", icon: ImageIcon, action: () => go("media"), group: "Navigate" },
    { id: "open-insights", label: "Open AI Insights", icon: Sparkles, action: () => go("insights"), group: "Navigate" },
    { id: "open-workspace", label: "Open workspace", icon: Building2, action: () => go("workspace"), group: "Navigate" },
    { id: "search-content", label: "Search content...", hint: "Global search", icon: Search, action: () => { setSearchOpen(true); setCommandOpen(false); }, group: "Actions" },
    { id: "ask-assistant", label: "Ask AI assistant...", hint: "Workspace chat", icon: Bot, action: () => { setAssistantOpen(true); setCommandOpen(false); }, group: "Actions" },
  ];

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  const groups: CommandItem["group"][] = ["Create", "Navigate", "Actions"];

  return (
    <AnimatePresence>
      {commandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <Command
              className="rounded-2xl border border-border bg-popover/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden"
              shouldFilter={false}
            >
              <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">esc</kbd>
              </div>
              <Command.List className="max-h-[420px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
                  No results for "{query}"
                </Command.Empty>
                {groups.map((group) => {
                  const groupItems = filtered.filter((i) => i.group === group);
                  if (groupItems.length === 0) return null;
                  return (
                    <Command.Group key={group} heading={group} className="mb-2">
                      {groupItems.map((item) => (
                        <Command.Item
                          key={item.id}
                          onSelect={() => item.action()}
                          className="flex items-center gap-2.5 rounded-md px-3 h-9 text-sm cursor-pointer aria-selected:bg-white aria-selected:text-black transition-colors"
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          <span className="flex-1">{item.label}</span>
                          {item.hint && (
                            <span className="text-[10px] text-muted-foreground">{item.hint}</span>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
              <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded">↑↓</kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded">↵</kbd>
                    select
                  </span>
                </div>
                <span className="font-mono">Nexus Command</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function GlobalSearch() {
  const { searchOpen, setSearchOpen, setView } = useStore();
  const [query, setQuery] = useState("");

  const results = [
    { type: "Posts", items: [{ title: "5 AI tools you should know", sub: "Instagram · scheduled" }, { title: "3 productivity hacks", sub: "TikTok · scheduled" }, { title: "Building with AI", sub: "LinkedIn · scheduled" }] },
    { type: "Comments", items: [{ title: "Reply to @startupguy", sub: "Instagram · 3 min ago" }, { title: "Reply to Priya Sharma", sub: "LinkedIn · 1 hour ago" }] },
    { type: "Automations", items: [{ title: "AI Topic Engagement", sub: "Active · 1,842 runs" }, { title: "Mention Auto-Reply", sub: "Active · 921 runs" }] },
    { type: "Accounts", items: [{ title: "@nexus.ai", sub: "TikTok · connected" }, { title: "@nexus.studio", sub: "Instagram · connected" }] },
    { type: "Media", items: [{ title: "hero-render-01.png", sub: "Generated · 4.2 MB" }, { title: "workflow-diagram.mp4", sub: "Video · 48 MB" }] },
  ];

  const filtered = results
    .map((g) => ({
      ...g,
      items: g.items.filter((i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.sub.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <AnimatePresence>
      {searchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="rounded-2xl border border-border bg-popover/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search posts, comments, automations, accounts, media..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">esc</kbd>
              </div>
              <div className="max-h-[480px] overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <div className="py-12 text-center">
                    <Search className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <div className="text-xs text-muted-foreground">No results for "{query}"</div>
                  </div>
                )}
                {filtered.map((g) => (
                  <div key={g.type} className="mb-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
                      {g.type}
                    </div>
                    {g.items.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => {
                          if (g.type === "Posts") setView("content");
                          else if (g.type === "Comments") setView("engagement");
                          else if (g.type === "Automations") setView("automations");
                          else if (g.type === "Accounts") setView("accounts");
                          else setView("media");
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center gap-3 rounded-md px-3 h-11 text-sm hover:bg-white hover:text-black transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{item.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AIAssistant() {
  const { assistantOpen, setAssistantOpen, chat, addChatMessage } = useStore();
  const [input, setInput] = useState("");

  const suggestions = [
    "Create a TikTok post about AI agents.",
    "Show my best performing posts.",
    "Schedule this for tomorrow at 7 PM.",
    "Why did engagement drop this week?",
    "Create an automation for AI-related content.",
  ];

  const send = (text: string) => {
    if (!text.trim()) return;
    addChatMessage({
      id: `c-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "now",
    });
    setInput("");
    setTimeout(() => {
      addChatMessage({
        id: `c-${Date.now() + 1}`,
        role: "assistant",
        content: generateResponse(text),
        timestamp: "now",
      });
    }, 600);
  };

  return (
    <AnimatePresence>
      {assistantOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setAssistantOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] bg-card border-l border-border flex flex-col"
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                  <Bot className="h-4 w-4 text-black" />
                </div>
                <div>
                  <div className="text-sm font-semibold">AI Assistant</div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    Workspace context active
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chat.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-white text-black rounded-br-md"
                        : "bg-background border border-border rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {chat.length <= 1 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-1">
                    Try asking
                  </div>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left rounded-lg border border-border bg-background/40 px-3 py-2.5 text-xs hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="rounded-xl border border-border bg-background/60 p-2 flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask Nexus to do something..."
                  className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground min-h-[36px] max-h-[120px] py-1.5 px-1"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim()}
                  className="h-8 px-3 rounded-lg bg-white text-black text-xs font-medium disabled:opacity-40 hover:bg-white/90 transition-colors"
                >
                  Send
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-1.5 px-1">
                Assistant will confirm before publishing or destructive actions.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function generateResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("tiktok") || lower.includes("post")) {
    return "I'll draft a TikTok post about AI agents. Here's a hook I'd suggest:\n\n\"Most people use AI agents wrong. They build one giant agent that does everything.\n\nHere's what actually works →\"\n\nWant me to generate 3 variants and add them to your approval queue? I'll schedule them for tomorrow 7 PM (peak audience window).";
  }
  if (lower.includes("best performing") || lower.includes("performance")) {
    return "Your top 3 posts this week by engagement:\n\n1. \"5 AI tools you should know\" — Instagram Reel — 18.4k reach, 8.2% engagement\n2. \"3 productivity hacks\" — TikTok — 22.1k reach, 7.4% engagement\n3. \"Building with AI\" — LinkedIn — 4.2k reach, 6.1% engagement\n\nCommon pattern: educational hooks outperform promotional ones by 2.3x.";
  }
  if (lower.includes("schedule")) {
    return "Scheduled. Tomorrow at 7:00 PM (Asia/Karachi) — your audience's peak window. I'll send you a notification 10 minutes before publishing so you can do a final review.";
  }
  if (lower.includes("engagement") || lower.includes("drop")) {
    return "Looking at this week's data — LinkedIn engagement dropped 18%. The likely cause: you increased posting frequency from 3/week to 7/week, but average post depth (measured by word count and unique ideas per post) decreased by 40%.\n\nRecommendation: revert to 3 longer-form posts/week. I can draft a 7-day content plan if helpful.";
  }
  if (lower.includes("automation")) {
    return "I'll create an automation:\n\nWHEN new content matching topic \"AI\" is detected\nIF engagement > 5%\nTHEN adapt for cross-platform publishing\nTHEN add to approval queue\n\nShall I create this automation?";
  }
  return "I can help with that. Want me to take a specific action — create content, schedule a post, analyze performance, or build an automation?";
}
