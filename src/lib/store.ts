"use client";

import { create } from "zustand";
import {
  getAuthUser,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  type AuthUser,
} from "./pocketbase";
import type {
  ChatMessage,
  ViewKey,
} from "./types";

// ============================================================
// Store — UI state, navigation, auth, toasts.
// All application data (posts, accounts, automations, notifications,
// media, comments, approvals, analytics, usage, activity) is fetched
// from the API via React Query (see src/lib/hooks/api.ts).
// There is NO mock data in this store.
// ============================================================

export interface ToastItem {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  description?: string;
}

interface AppState {
  // Navigation
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // Public page navigation
  publicView: string;
  setPublicView: (v: string) => void;

  // Blog post slug (for navigation)
  blogSlug?: string;

  // UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;

  // In-app view (landing vs dashboard)
  inApp: boolean;
  enterApp: () => void;
  exitApp: () => void;

  // Auth
  user: AuthUser | null;
  authReady: boolean;
  authLoading: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "signup";
  setAuthModalOpen: (v: boolean, mode?: "login" | "signup") => void;
  setAuthModalMode: (m: "login" | "signup") => void;
  initAuth: () => void;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logOut: () => void;

  // Chat (AI Assistant — ephemeral, not persisted)
  chat: ChatMessage[];
  addChatMessage: (m: ChatMessage) => void;

  // Calendar post detail modal
  selectedPostId: string | null;
  setSelectedPost: (id: string | null) => void;

  // Toasts (ephemeral)
  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;

  // Settings tab
  settingsTab: string;
  setSettingsTab: (t: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  view: "overview",
  setView: (view) => {
    set({ view });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  },

  publicView: "home",
  setPublicView: (publicView) => {
    set({ publicView });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  },

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  notifOpen: false,
  setNotifOpen: (notifOpen) => set({ notifOpen }),
  assistantOpen: false,
  setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),

  inApp: false,
  enterApp: () => {
    set({ inApp: true, view: "overview" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  },
  exitApp: () => set({ inApp: false }),

  // Auth
  user: null,
  authReady: false,
  authLoading: false,
  authModalOpen: false,
  authModalMode: "login",
  setAuthModalOpen: (v, mode) =>
    set((s) => ({
      authModalOpen: v,
      authModalMode: mode ?? s.authModalMode,
    })),
  setAuthModalMode: (authModalMode) => set({ authModalMode }),
  initAuth: () => {
    const user = getAuthUser();
    set({ user, authReady: true });
  },
  signIn: async (email, password) => {
    set({ authLoading: true });
    const res = await signInWithEmail(email, password);
    if (res.ok) {
      set({ user: getAuthUser(), authLoading: false, authModalOpen: false });
    } else {
      set({ authLoading: false });
    }
    return res;
  },
  signUp: async (email, password, name) => {
    set({ authLoading: true });
    const res = await signUpWithEmail(email, password, name);
    if (res.ok) {
      set({ user: getAuthUser(), authLoading: false, authModalOpen: false });
    } else {
      set({ authLoading: false });
    }
    return res;
  },
  logOut: () => {
    signOut();
    set({ user: null, inApp: false, view: "overview" });
  },

  chat: [],
  addChatMessage: (m) => set((s) => ({ chat: [...s.chat, m] })),

  selectedPostId: null,
  setSelectedPost: (selectedPostId) => set({ selectedPostId }),

  toasts: [],
  pushToast: (t) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Auto-dismiss after 4 seconds
    if (typeof window !== "undefined") {
      setTimeout(() => {
        get().dismissToast(id);
      }, 4000);
    }
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  settingsTab: "profile",
  setSettingsTab: (settingsTab) => set({ settingsTab }),
}));
