"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Calendar,
  MessageSquare,
  Workflow,
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  Building2,
  Link2,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { ViewKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  key: ViewKey | "more";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNav: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: FileText },
  { key: "create", label: "Create", icon: Plus },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "engagement", label: "Engagement", icon: MessageSquare },
  { key: "automations", label: "Automations", icon: Workflow },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "insights", label: "AI Insights", icon: Sparkles },
];

const bottomNav: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "workspace", label: "Workspace", icon: Building2 },
  { key: "accounts", label: "Social Accounts", icon: Link2 },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const { view, setView, sidebarCollapsed, toggleSidebar } = useStore();

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-sidebar/60 backdrop-blur-xl hidden md:flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-[68px]" : "w-[244px]",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <button
          onClick={() => setView("overview")}
          className="flex items-center gap-2.5 group"
        >
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <div className="h-3.5 w-3.5 bg-black rounded-sm" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold tracking-tight">Nexus</span>
          )}
        </button>
        {!sidebarCollapsed && (
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">v2.4</span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!sidebarCollapsed && (
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
            Workspace
          </div>
        )}
        {mainNav.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={view === item.key}
            collapsed={sidebarCollapsed}
            onClick={() => setView(item.key)}
          />
        ))}

        <div className="pt-4">
          {!sidebarCollapsed && (
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
              Manage
            </div>
          )}
          {bottomNav.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={view === item.key}
              collapsed={sidebarCollapsed}
              onClick={() => setView(item.key)}
            />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 rounded-md h-8 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors text-xs"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group w-full flex items-center gap-2.5 rounded-md px-3 h-9 text-sm transition-colors relative",
        active
          ? "bg-white text-black"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded",
            active ? "bg-black/10 text-black" : "bg-white/5 text-muted-foreground",
          )}
        >
          {item.badge}
        </span>
      )}
      {collapsed && item.badge && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white" />
      )}
    </button>
  );
}

export function MobileNav() {
  const { view, setView, setMobileNavOpen } = useStore();

  const items: NavItem[] = [
    { key: "overview", label: "Home", icon: LayoutDashboard },
    { key: "create", label: "Create", icon: Plus },
    { key: "calendar", label: "Calendar", icon: Calendar },
    { key: "analytics", label: "Stats", icon: BarChart3 },
    { key: "more", label: "More", icon: SettingsIcon },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {items.map((item) => {
            const isActive =
              item.key === "more"
                ? false
                : view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === "more") {
                    setMobileNavOpen(true);
                  } else {
                    setView(item.key);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors",
                  isActive ? "text-white" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-white")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <MobileNavDrawer />
    </>
  );
}

function MobileNavDrawer() {
  const { mobileNavOpen, setMobileNavOpen, setView, view } = useStore();

  const groups: { title: string; items: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
    {
      title: "Workspace",
      items: [
        { key: "overview", label: "Overview", icon: LayoutDashboard },
        { key: "content", label: "Content", icon: FileText },
        { key: "create", label: "Create", icon: Plus },
        { key: "calendar", label: "Calendar", icon: Calendar },
        { key: "engagement", label: "Engagement", icon: MessageSquare },
        { key: "automations", label: "Automations", icon: Workflow },
        { key: "analytics", label: "Analytics", icon: BarChart3 },
        { key: "media", label: "Media", icon: ImageIcon },
        { key: "insights", label: "AI Insights", icon: Sparkles },
      ],
    },
    {
      title: "Manage",
      items: [
        { key: "workspace", label: "Workspace", icon: Building2 },
        { key: "accounts", label: "Social Accounts", icon: Link2 },
        { key: "approvals", label: "Approvals", icon: FileText },
        { key: "usage", label: "Usage", icon: BarChart3 },
        { key: "billing", label: "Billing", icon: FileText },
        { key: "settings", label: "Settings", icon: SettingsIcon },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">All views</div>
                <div className="text-[11px] text-muted-foreground">Pick a destination</div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              {groups.map((g) => (
                <div key={g.title} className="mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 py-2">
                    {g.title}
                  </div>
                  {g.items.map((item) => {
                    const isActive = view === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setView(item.key);
                          setMobileNavOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-md px-3 h-11 text-sm transition-colors",
                          isActive
                            ? "bg-white text-black"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
