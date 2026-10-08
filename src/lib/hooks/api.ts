"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// ============================================================
// Types (mirrors server response shapes)
// ============================================================

export interface Post {
  id: string;
  platform: string;
  type: string;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  media?: string[];
  scheduledAt: string | null;
  publishedAt: string | null;
  status: string;
  error?: string;
  socialAccount?: { id: string; platform: string; username: string; displayName: string } | null;
  tone: string;
  language: string;
  audience: string;
  created: string;
  updated: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  status: string;
  followers: number;
  permissions: string[];
  contentPermissions: string[];
  lastSync: string | null;
  health: number;
  avatar: string | null;
  created: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  conditions: unknown[];
  actions: unknown[];
  status: string;
  rateLimits: Record<string, unknown>;
  lastExecution: string | null;
  runCount: number;
  errorCount: number;
  created: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  read: boolean;
  link: string | null;
  created: string;
}

export interface UsageItem {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  tags: string[];
  url: string | null;
  created: string;
}

export interface CommentItem {
  id: string;
  platform: string;
  author: string;
  content: string;
  postTitle: string;
  aiReply: string;
  status: string;
  confidence: number;
  receivedAt: string | null;
  created: string;
}

export interface ApprovalItem {
  id: string;
  type: string;
  platform: string;
  content: string;
  confidence: number;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  user: { id: string; name: string; email: string } | null;
  created: string;
}

export interface AnalyticsData {
  totals: {
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagement: number;
    records: number;
  };
  trend: { date: string; reach: number; impressions: number; engagement: number }[];
  hasData: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  members: number;
  connectedAccounts: number;
  activeAutomations: number;
  created: string;
}

// ============================================================
// Hooks
// ============================================================

export function usePosts(filters: { status?: string; platform?: string; q?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.platform && filters.platform !== "all") params.set("platform", filters.platform);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return useQuery<{ ok: boolean; items: Post[] }>({
    queryKey: ["posts", filters],
    queryFn: () => api.get(`/api/posts${qs ? `?${qs}` : ""}`),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Post>) => api.post("/api/posts", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<Post>) =>
      api.patch(`/api/posts/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function usePublishPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/posts/${id}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSchedulePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, scheduledAt }: { postId: string; scheduledAt: string }) =>
      api.post("/api/schedules", { postId, scheduledAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSocialAccounts() {
  return useQuery<{ ok: boolean; items: SocialAccount[] }>({
    queryKey: ["social-accounts"],
    queryFn: () => api.get("/api/social-accounts"),
  });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { platform: string; username: string; displayName?: string }) =>
      api.post("/api/social-accounts", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, platform }: { id: string; platform: string }) =>
      api.post(`/api/social/${platform}/disconnect`, { accountId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useAutomations(filters: { status?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const qs = params.toString();
  return useQuery<{ ok: boolean; items: Automation[] }>({
    queryKey: ["automations", filters],
    queryFn: () => api.get(`/api/automations${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/automations", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api.patch(`/api/automations/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/automations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useNotifications() {
  return useQuery<{ ok: boolean; items: NotificationItem[]; unread: number }>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
    refetchInterval: 30_000, // poll every 30s for new notifications
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      api.patch(`/api/notifications/${id}`, { read }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/notifications"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUsage() {
  return useQuery<{ ok: boolean; items: UsageItem[]; period: string }>({
    queryKey: ["usage"],
    queryFn: () => api.get("/api/usage"),
  });
}

export function useMedia(filters: { type?: string; q?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return useQuery<{ ok: boolean; items: MediaAsset[] }>({
    queryKey: ["media", filters],
    queryFn: () => api.get(`/api/media${qs ? `?${qs}` : ""}`),
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { file: File; name?: string; type?: string; tags?: string }) => {
      const fd = new FormData();
      fd.append("file", vars.file);
      if (vars.name) fd.append("name", vars.name);
      if (vars.type) fd.append("type", vars.type);
      if (vars.tags) fd.append("tags", vars.tags);
      return api.upload("/api/media", fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useComments(filters: { status?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const qs = params.toString();
  return useQuery<{ ok: boolean; items: CommentItem[] }>({
    queryKey: ["comments", filters],
    queryFn: () => api.get(`/api/comments${qs ? `?${qs}` : ""}`),
  });
}

export function useApprovals(status: string = "pending") {
  return useQuery<{ ok: boolean; items: ApprovalItem[]; counts: Record<string, number> }>({
    queryKey: ["approvals", status],
    queryFn: () => api.get(`/api/approvals?status=${status}`),
  });
}

export function useUpdateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api.patch(`/api/approvals/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useActivity(limit: number = 20) {
  return useQuery<{ ok: boolean; items: ActivityLog[] }>({
    queryKey: ["activity", limit],
    queryFn: () => api.get(`/api/activity?limit=${limit}`),
    refetchInterval: 15_000,
  });
}

export function useAnalytics(period: string = "30d") {
  return useQuery<{ ok: boolean; totals: AnalyticsData["totals"]; trend: AnalyticsData["trend"]; hasData: boolean }>({
    queryKey: ["analytics", period],
    queryFn: () => api.get(`/api/analytics?period=${period}`),
  });
}

export function useWorkspaces() {
  return useQuery<{ ok: boolean; items: Workspace[]; current: string }>({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/api/workspaces"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string }) => api.patch("/api/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useGenerateContent() {
  return useMutation<{ ok: boolean; variants: GeneratedVariant[]; provider?: string; model?: string; durationMs?: number }, Error, Record<string, unknown>>({
    mutationFn: (body: Record<string, unknown>) => api.post("/api/ai/generate", body),
  });
}

// Variant type for AI generation responses
interface GeneratedVariant {
  label: string;
  tone: string;
  content: string;
  hashtags: string[];
  predictedEngagement: string;
  confidence: number;
}

export function useSetupStatus() {
  return useQuery<{ ok: boolean; total: number; existing: string[]; missing: string[]; adminConfigured: boolean }>({
    queryKey: ["pb-setup-status"],
    queryFn: () => api.get("/api/admin/setup"),
  });
}

export function useRunMigration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/admin/setup"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pb-setup-status"] });
    },
  });
}
