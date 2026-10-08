"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Link2,
  Sparkles,
  Workflow,
  Bell,
  Shield,
  Users as UsersIcon,
  CreditCard,
  Code,
  Globe,
  Sun,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useWorkspaces, useUpdateProfile } from "@/lib/hooks/api";
import { EmptyState } from "../EmptyState";

export function SettingsView() {
  const [tab, setTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "accounts", label: "Social Accounts", icon: Link2 },
    { id: "ai", label: "AI Providers", icon: Sparkles },
    { id: "automation", label: "Automation", icon: Workflow },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "team", label: "Team", icon: UsersIcon },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "api", label: "API", icon: Code },
    { id: "usage", label: "Usage", icon: Globe },
    { id: "appearance", label: "Appearance", icon: Sun },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-1">
        <div className="rounded-xl border border-border bg-card/40 p-2 sticky top-20">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-md px-3 h-9 text-xs transition-colors",
                tab === t.id
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-3">
        {tab === "profile" && <ProfileSection />}
        {tab === "workspace" && <WorkspaceSection />}
        {tab === "accounts" && <AccountsLinkSection />}
        {tab === "ai" && <PlaceholderSection title="AI Providers" desc="Configure which AI provider generates your content. Bring your own API key on Business plan." />}
        {tab === "automation" && <PlaceholderSection title="Automation" desc="Global automation settings and safety limits." />}
        {tab === "notifications" && <PlaceholderSection title="Notifications" desc="Choose what you want to be notified about." />}
        {tab === "security" && <PlaceholderSection title="Security" desc="Two-factor authentication, sessions, and audit logs." />}
        {tab === "team" && <PlaceholderSection title="Team" desc="Manage members and their roles." />}
        {tab === "billing" && <PlaceholderSection title="Billing" desc="Manage your subscription and invoices." />}
        {tab === "api" && <PlaceholderSection title="API" desc="Programmatic access to your workspace." />}
        {tab === "usage" && <PlaceholderSection title="Usage" desc="Track your workspace consumption and limits." />}
        {tab === "appearance" && <PlaceholderSection title="Appearance" desc="Customize the look and feel of your workspace." />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const user = useStore((s) => s.user);
  const pushToast = useStore((s) => s.pushToast);
  const updateProfile = useUpdateProfile();

  const handleSave = async (name: string) => {
    if (!name.trim()) {
      pushToast({ type: "warning", title: "Name required" });
      return;
    }
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      pushToast({ type: "success", title: "Profile updated", description: "Your name has been saved." });
      const { initAuth } = useStore.getState();
      initAuth();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Update failed", description: e.message });
    }
  };

  return (
    <ProfileForm
      key={user?.id || "anon"}
      initialName={user?.name || ""}
      email={user?.email || ""}
      isPending={updateProfile.isPending}
      onSave={handleSave}
    />
  );
}

function ProfileForm({
  initialName,
  email,
  isPending,
  onSave,
}: {
  initialName: string;
  email: string;
  isPending: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-6">
      <h3 className="text-sm font-medium">Profile</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-5">Your personal account information</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full border border-border bg-gradient-to-br from-white to-white/60 flex items-center justify-center text-lg font-medium text-black">
          {(name || email || "U").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors">
            Change avatar
          </button>
          <div className="text-[10px] text-muted-foreground mt-1.5">JPG, PNG or GIF. Max 2MB.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] text-muted-foreground">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Email</label>
          <input
            value={email}
            disabled
            className="mt-1 w-full rounded-lg border border-border bg-background/20 h-10 px-3 text-sm outline-none opacity-60"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => onSave(name)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save changes
        </button>
      </div>
    </div>
  );
}

function WorkspaceSection() {
  const workspacesQuery = useWorkspaces();
  const pushToast = useStore((s) => s.pushToast);
  const ws = workspacesQuery.data?.items?.[0];

  const handleSave = async (name: string) => {
    if (!name.trim()) return;
    try {
      const { api } = await import("@/lib/api-client");
      await api.patch("/api/workspaces", { name: name.trim() });
      pushToast({ type: "success", title: "Workspace updated" });
      workspacesQuery.refetch();
    } catch (err) {
      const e = err as Error;
      pushToast({ type: "error", title: "Update failed", description: e.message });
    }
  };

  if (workspacesQuery.isLoading) {
    return <div className="rounded-xl border border-border bg-card/40 p-6 animate-pulse h-48" />;
  }

  return (
    <WorkspaceForm
      key={ws?.id || "new"}
      initialName={ws?.name || ""}
      plan={ws?.plan?.toUpperCase() || "FREE"}
      onSave={handleSave}
    />
  );
}

function WorkspaceForm({
  initialName,
  plan,
  onSave,
}: {
  initialName: string;
  plan: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-6">
      <h3 className="text-sm font-medium">Workspace</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-5">Manage your workspace identity</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] text-muted-foreground">Workspace name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Plan</label>
          <input
            value={plan}
            disabled
            className="mt-1 w-full rounded-lg border border-border bg-background/20 h-10 px-3 text-sm outline-none opacity-60"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={() => onSave(name)}
          className="rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

function AccountsLinkSection() {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-6">
      <h3 className="text-sm font-medium">Connected Social Accounts</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-5">Manage which platforms have access to your workspace</p>
      <EmptyState
        icon={Link2}
        title="No accounts connected"
        description="Connect your first account from the Social Accounts page to start publishing."
        size="sm"
      />
    </div>
  );
}

function PlaceholderSection({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-6">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-5">{desc}</p>
      <div className="py-8 text-center">
        <div className="text-xs text-muted-foreground">
          {title === "AI Providers" && "Configure AI providers in your .env file. Default provider (z-ai) works out of the box."}
          {title === "Automation" && "Configure automation safety limits from the Automations page. Global settings will appear here."}
          {title === "Notifications" && "Notification preferences are managed per-event. You can mark notifications as read from the bell icon."}
          {title === "Security" && "Your account uses PocketBase authentication. Two-factor authentication will be available in a future update."}
          {title === "Team" && "Invite team members from the Workspace page. Members get role-based access to your workspace."}
          {title === "API" && "API access uses your PocketBase auth token. Programmatic API keys will be available in a future update."}
          {title === "Usage" && "View your current usage from the Usage page in the sidebar. Limits are based on your workspace plan."}
          {title === "Appearance" && "Nexus uses a premium dark theme optimized for focused work. Theme customization will be available in a future update."}
        </div>
      </div>
    </div>
  );
}
