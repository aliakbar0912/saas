"use client";

import {
  Search,
  Bell,
  Command as CommandIcon,
  Bot,
  ChevronDown,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  LogOut,
  User,
  CreditCard,
  Settings as SettingsIcon,
  Keyboard,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/lib/hooks/api";
import { CommandPalette, GlobalSearch, AIAssistant } from "./CommandPalette";
import { cn } from "@/lib/utils";

const viewTitles: Record<string, { title: string; sub: string }> = {
  overview: { title: "Good afternoon.", sub: "Here's what's happening across your social workspace." },
  content: { title: "Content", sub: "Manage your published and drafted content across platforms." },
  create: { title: "AI Content Studio", sub: "Generate platform-optimized content with multiple variants." },
  calendar: { title: "Content Calendar", sub: "Schedule and visualize your publishing pipeline." },
  engagement: { title: "Engagement", sub: "AI-powered comment automation and audience interaction." },
  automations: { title: "Automations", sub: "Build visual workflows with triggers and actions." },
  analytics: { title: "Analytics", sub: "Cross-platform performance and audience insights." },
  media: { title: "Media Library", sub: "Upload, generate, and manage your visual assets." },
  insights: { title: "AI Insights", sub: "Pattern detection and strategic recommendations." },
  workspace: { title: "Workspace", sub: "Manage your team, roles, and workspace settings." },
  accounts: { title: "Social Accounts", sub: "Connect and manage your platform connections." },
  settings: { title: "Settings", sub: "Configure your workspace and preferences." },
  approvals: { title: "Approval Center", sub: "Review AI-generated content before publishing." },
  usage: { title: "Usage", sub: "Track your workspace consumption and limits." },
  billing: { title: "Billing", sub: "Manage your subscription and invoices." },
};

export function Topbar() {
  const { view, setCommandOpen, setNotifOpen, setAssistantOpen, setView, setSearchOpen, user, logOut } = useStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const meta = viewTitles[view] ?? viewTitles.overview;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen, setSearchOpen]);

  const unread = useNotifications().data?.unread ?? 0;

  return (
    <>
      <CommandPalette />
      <GlobalSearch />
      <AIAssistant />
      <NotificationCenter />

      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Left: page title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold truncate">{meta.title}</h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{meta.sub}</p>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card/40 h-9 px-3 text-xs text-muted-foreground hover:bg-card/80 transition-colors min-w-[200px]"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>

            {/* Quick search icon (mobile) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* New */}
            <button
              onClick={() => setView("create")}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-3 text-xs font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </button>

            {/* Assistant */}
            <button
              onClick={() => setAssistantOpen(true)}
              className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-card/80 transition-colors"
              title="AI Assistant"
            >
              <Bot className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-card/80 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="h-9 pl-1 pr-2 rounded-lg border border-border flex items-center gap-2 hover:bg-card/80 transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-white to-white/60 flex items-center justify-center text-[10px] font-medium text-black">
                  {(user?.name || user?.email || "NX").slice(0, 2).toUpperCase()}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-popover shadow-2xl shadow-black/40 p-1.5 z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-border mb-1">
                        <div className="text-sm font-medium truncate">{user?.name || "Workspace Owner"}</div>
                        <div className="text-xs text-muted-foreground truncate">{user?.email || "—"}</div>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          Pro plan
                        </div>
                      </div>
                      <ProfileMenuItem icon={User} label="Profile" onClick={() => { setView("settings"); setProfileOpen(false); }} />
                      <ProfileMenuItem icon={SettingsIcon} label="Settings" onClick={() => { setView("settings"); setProfileOpen(false); }} />
                      <ProfileMenuItem icon={CreditCard} label="Billing" onClick={() => { setView("billing"); setProfileOpen(false); }} />
                      <ProfileMenuItem icon={Keyboard} label="Keyboard shortcuts" onClick={() => setProfileOpen(false)} />
                      <ProfileMenuItem icon={HelpCircle} label="Help & docs" onClick={() => setProfileOpen(false)} />
                      <div className="my-1 h-px bg-border" />
                      <ProfileMenuItem icon={LogOut} label="Sign out" onClick={() => { setProfileOpen(false); logOut(); }} danger />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-md px-3 h-8 text-xs transition-colors",
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function NotificationCenter() {
  const { notifOpen, setNotifOpen, pushToast } = useStore();
  const notifQuery = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notifQuery.data?.items ?? [];
  const unread = notifQuery.data?.unread ?? 0;

  const handleMarkAllRead = async () => {
    try {
      await markAllMutation.mutateAsync();
      pushToast({ type: "success", title: "All caught up", description: "Marked all notifications as read." });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Failed", description: e.message });
    }
  };

  const handleMarkRead = async (id: string, read: boolean) => {
    try {
      await markReadMutation.mutateAsync({ id, read });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Failed", description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      pushToast({ type: "info", title: "Notification deleted" });
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Failed", description: e.message });
    }
  };

  return (
    <AnimatePresence>
      {notifOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setNotifOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[400px] bg-card border-l border-border flex flex-col"
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-border">
              <div>
                <div className="text-sm font-semibold">Notifications</div>
                <div className="text-[11px] text-muted-foreground">{unread} unread</div>
              </div>
              <button
                onClick={() => setNotifOpen(false)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
              >
                <CommandIcon className="h-3.5 w-3.5 rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.map((n) => {
                const iconMap = {
                  success: CheckCircle2,
                  info: Info,
                  warning: AlertTriangle,
                  error: XCircle,
                };
                const Icon = iconMap[n.type as keyof typeof iconMap] || Info;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group rounded-lg border p-3 transition-colors",
                      n.read
                        ? "border-border bg-background/40"
                        : "border-white/20 bg-white/[0.03]",
                    )}
                  >
                    <button
                      onClick={() => !n.read && handleMarkRead(n.id, true)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          n.type === "success" && "text-white",
                          n.type === "info" && "text-muted-foreground",
                          n.type === "warning" && "text-amber-400",
                          n.type === "error" && "text-red-400",
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium">{n.title}</div>
                          {n.description && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.description}</div>
                          )}
                          <div className="text-[10px] text-muted-foreground/70 mt-1.5 font-mono">
                            {new Date(n.created).toLocaleString()}
                          </div>
                        </div>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0 mt-1" />}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-[10px] text-muted-foreground hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-3 flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={unread === 0 || markAllMutation.isPending}
                className="flex-1 rounded-lg h-9 text-xs text-muted-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark all as read{unread > 0 ? ` (${unread})` : ""}
              </button>
              <button className="rounded-lg h-9 px-3 text-xs text-muted-foreground hover:bg-accent transition-colors">
                Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
