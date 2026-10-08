"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, MobileNav } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "./Toaster";
import { SetupBanner } from "./SetupBanner";
import { OverviewView } from "./views/OverviewView";
import { CreateView } from "./views/CreateView";
import { CalendarView } from "./views/CalendarView";
import { EngagementView } from "./views/EngagementView";
import { AutomationsView } from "./views/AutomationsView";
import { AnalyticsView, InsightsView } from "./views/AnalyticsView";
import { MediaView } from "./views/MediaView";
import { AccountsView } from "./views/AccountsView";
import { ApprovalsView } from "./views/ApprovalsView";
import { SettingsView } from "./views/SettingsView";
import { WorkspaceView } from "./views/WorkspaceView";
import { ContentView } from "./views/ContentView";
import { UsageView } from "./views/UsageView";
import { BillingView } from "./views/BillingView";
import { useStore } from "@/lib/store";

export function AppShell() {
  const view = useStore((s) => s.view);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderView(view)}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <Toaster />
      <SetupBanner />
    </div>
  );
}

function renderView(view: string) {
  switch (view) {
    case "overview":
      return <OverviewView />;
    case "content":
      return <ContentView />;
    case "create":
      return <CreateView />;
    case "calendar":
      return <CalendarView />;
    case "engagement":
      return <EngagementView />;
    case "automations":
      return <AutomationsView />;
    case "analytics":
      return <AnalyticsView />;
    case "insights":
      return <InsightsView />;
    case "media":
      return <MediaView />;
    case "accounts":
      return <AccountsView />;
    case "approvals":
      return <ApprovalsView />;
    case "settings":
      return <SettingsView />;
    case "workspace":
      return <WorkspaceView />;
    case "usage":
      return <UsageView />;
    case "billing":
      return <BillingView />;
    default:
      return <OverviewView />;
  }
}

