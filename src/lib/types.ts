// ============================================================
// Type definitions for the Nexus platform
// ============================================================

export type Platform =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "youtube"
  | "x"
  | "linkedin"
  | "threads"
  | "pinterest";

export type ConnectionStatus = "connected" | "disconnected" | "error" | "expired";

export type ContentType =
  | "post"
  | "caption"
  | "reel-idea"
  | "tiktok-script"
  | "youtube-description"
  | "linkedin-post"
  | "thread"
  | "story"
  | "comment"
  | "reply";

export type PostStatus =
  | "queued"
  | "processing"
  | "scheduled"
  | "published"
  | "failed"
  | "retrying"
  | "cancelled";

export type AutomationStatus = "active" | "paused" | "failed";

export type ActivityType =
  | "generated"
  | "prepared"
  | "analyzed"
  | "scheduled"
  | "published"
  | "commented"
  | "engaged"
  | "failed";

export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  displayName: string;
  avatar?: string;
  status: ConnectionStatus;
  lastSync: string;
  permissions: string[];
  contentPermissions: string[];
  followers: number;
  health: number; // 0-100
}

export interface Post {
  id: string;
  platform: Platform;
  title: string;
  caption: string;
  scheduledAt: string; // ISO time
  status: PostStatus;
  account: string;
  type: string;
  media?: string;
  engagement?: { likes: number; comments: number; shares: number; saves: number; reach: number };
}

export interface AIActivity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  status: "success" | "processing" | "warning";
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  status: AutomationStatus;
  runs: number;
  lastExecution: string;
  errors: number;
}

export interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface ApprovalItem {
  id: string;
  type: ContentType;
  platform: Platform;
  content: string;
  account: string;
  createdAt: string;
  confidence: number;
  status: "pending" | "approved" | "rejected";
}

export interface CommentThread {
  id: string;
  platform: Platform;
  postTitle: string;
  author: string;
  content: string;
  aiReply: string;
  timestamp: string;
  status: "auto" | "approved" | "queued";
  confidence: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "generated";
  size: string;
  createdAt: string;
  url?: string;
  tags: string[];
}

export interface AnalyticsDataPoint {
  label: string;
  reach: number;
  impressions: number;
  engagement: number;
}

export interface UsageStat {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

export interface AIInsight {
  id: string;
  type: "positive" | "neutral" | "warning";
  title: string;
  description: string;
  metric?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type ViewKey =
  | "overview"
  | "content"
  | "create"
  | "calendar"
  | "engagement"
  | "automations"
  | "analytics"
  | "media"
  | "insights"
  | "workspace"
  | "accounts"
  | "settings"
  | "approvals"
  | "usage"
  | "billing";
