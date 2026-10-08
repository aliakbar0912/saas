// ============================================================
// PocketBase schema definition
// ============================================================
// This module defines every collection, field, relation, and API rule
// for the Nexus platform. It is consumed by:
//   - the /api/admin/setup route (idempotent schema creation)
//   - the local `bun run db:setup` script
// All operations are idempotent — safe to run repeatedly.
// ============================================================

// Field types we support (subset of PocketBase schema field types)
export type FieldType =
  | "text"
  | "number"
  | "bool"
  | "email"
  | "url"
  | "date"
  | "select"
  | "json"
  | "file"
  | "relation"
  | "editor";

export interface FieldDef {
  name: string;
  type: FieldType;
  required?: boolean;
  options?: {
    min?: number;
    max?: number;
    pattern?: string;
    multiple?: boolean;
    cascade?: "delete" | "restrict" | "null";
    maxSelect?: number;
    collectionId?: string; // for relation fields (resolved later)
    values?: string[]; // for select fields
    maxSize?: number; // for file fields (bytes)
    mimeTypes?: string[]; // for file fields
    exceptDomains?: string[];
    onlyDomains?: string[];
  };
}

export interface CollectionDef {
  name: string;
  type: "auth" | "base";
  fields: FieldDef[];
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
  // used for relations (collection name → resolved later)
  singularLabel?: string;
}

// ============================================================
// COLLECTION DEFINITIONS
// ============================================================
//
// API rules use PocketBase's @request syntax. Workspace isolation is
// enforced via a `workspace` relation on every collection that owns data.
// A `workspaces` collection holds the workspace records; `workspace_members`
// links users to workspaces with a role.
//
// The list/view/update/delete rule for an owner-scoped collection is:
//   workspace.members ?@request.relation.members.id : false
// which means "the requesting user is a member of the workspace".
// We also accept `@request.auth.id = workspace.owner` so owners always
// have access.
// ============================================================

export const collections: CollectionDef[] = [
  // ----------------------------------------
  // workspaces — top-level tenant
  // ----------------------------------------
  {
    name: "workspaces",
    type: "base",
    singularLabel: "Workspace",
    fields: [
      { name: "name", type: "text", required: true, options: { min: 1, max: 100 } },
      { name: "slug", type: "text", required: false, options: { max: 50 } },
      { name: "owner", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "restrict" } },
      { name: "plan", type: "select", options: { values: ["free", "starter", "pro", "business"] }, required: false },
      { name: "logo", type: "file", options: { maxSize: 2_000_000, mimeTypes: ["image/png", "image/jpeg", "image/svg+xml"] } },
      { name: "settings", type: "json", required: false },
    ],
    listRule: "owner = @request.auth.id || members.id ?@request.relation.members.id",
    viewRule: "owner = @request.auth.id || members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: "owner = @request.auth.id",
    deleteRule: "owner = @request.auth.id",
  },

  // ----------------------------------------
  // workspace_members — user × workspace × role
  // ----------------------------------------
  {
    name: "workspace_members",
    type: "base",
    singularLabel: "Workspace Member",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "user", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "delete" } },
      { name: "role", type: "select", required: true, options: { values: ["owner", "admin", "editor", "approver", "viewer"] } },
      { name: "invited_email", type: "email", required: false },
      { name: "status", type: "select", options: { values: ["active", "pending", "revoked"] }, required: false },
    ],
    listRule: "user = @request.auth.id || workspace.owner = @request.auth.id",
    viewRule: "user = @request.auth.id || workspace.owner = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "workspace.owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id || user = @request.auth.id",
  },

  // ----------------------------------------
  // social_accounts — connected platform accounts
  // ----------------------------------------
  {
    name: "social_accounts",
    type: "base",
    singularLabel: "Social Account",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "owner", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "platform", type: "select", required: true, options: { values: ["tiktok", "instagram", "facebook", "youtube", "x", "linkedin", "threads", "pinterest"] } },
      { name: "username", type: "text", required: true },
      { name: "display_name", type: "text", required: false },
      { name: "avatar", type: "file", options: { maxSize: 5_000_000, mimeTypes: ["image/png", "image/jpeg", "image/webp"] } },
      { name: "status", type: "select", options: { values: ["connected", "expired", "disconnected", "error"] }, required: false },
      { name: "followers", type: "number", required: false, options: { min: 0 } },
      { name: "permissions", type: "json", required: false },
      { name: "content_permissions", type: "json", required: false },
      { name: "last_sync", type: "date", required: false },
      { name: "health", type: "number", required: false, options: { min: 0, max: 100 } },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "workspace.owner = @request.auth.id",
    updateRule: "workspace.owner = @request.auth.id || owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // oauth_connections — tokens for each social account
  // (Tokens NEVER reach the browser; only opaque IDs do.)
  // ----------------------------------------
  {
    name: "oauth_connections",
    type: "base",
    singularLabel: "OAuth Connection",
    fields: [
      { name: "social_account", type: "relation", required: true, options: { collectionId: "social_accounts", maxSelect: 1, cascade: "delete" } },
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "provider", type: "text", required: true },
      { name: "access_token", type: "text", required: false }, // stored server-side only; API rule hides from client
      { name: "refresh_token", type: "text", required: false },
      { name: "expires_at", type: "date", required: false },
      { name: "scope", type: "text", required: false },
      { name: "external_id", type: "text", required: false },
    ],
    // Strict: only readable via server admin. Client gets nothing.
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  },

  // ----------------------------------------
  // posts — content lifecycle
  // ----------------------------------------
  {
    name: "posts",
    type: "base",
    singularLabel: "Post",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "author", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "social_account", type: "relation", required: false, options: { collectionId: "social_accounts", maxSelect: 1, cascade: "null" } },
      { name: "platform", type: "select", required: true, options: { values: ["tiktok", "instagram", "facebook", "youtube", "x", "linkedin", "threads", "pinterest"] } },
      { name: "type", type: "text", required: false }, // post, caption, reel, tiktok-script, etc.
      { name: "title", type: "text", required: true },
      { name: "caption", type: "text", required: false },
      { name: "hashtags", type: "json", required: false }, // array of strings
      { name: "cta", type: "text", required: false },
      { name: "media", type: "json", required: false }, // array of media IDs
      { name: "scheduled_at", type: "date", required: false },
      { name: "published_at", type: "date", required: false },
      { name: "status", type: "select", required: true, options: { values: ["draft", "pending_approval", "scheduled", "processing", "published", "failed", "cancelled"] } },
      { name: "error", type: "text", required: false },
      { name: "external_post_id", type: "text", required: false },
      { name: "tone", type: "text", required: false },
      { name: "language", type: "text", required: false },
      { name: "audience", type: "text", required: false },
      { name: "metadata", type: "json", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
  },

  // ----------------------------------------
  // post_variants — AI-generated variants of a post
  // ----------------------------------------
  {
    name: "post_variants",
    type: "base",
    singularLabel: "Post Variant",
    fields: [
      { name: "post", type: "relation", required: true, options: { collectionId: "posts", maxSelect: 1, cascade: "delete" } },
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "label", type: "text", required: false }, // "Variant A", "Variant B", ...
      { name: "tone", type: "text", required: false },
      { name: "content", type: "text", required: true },
      { name: "hashtags", type: "json", required: false },
      { name: "predicted_engagement", type: "text", required: false },
      { name: "confidence", type: "number", required: false, options: { min: 0, max: 1 } },
      { name: "is_selected", type: "bool", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
  },

  // ----------------------------------------
  // media — uploaded/generated assets
  // ----------------------------------------
  {
    name: "media",
    type: "base",
    singularLabel: "Media Asset",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "uploaded_by", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "name", type: "text", required: true },
      { name: "file", type: "file", required: true, options: { maxSize: 100_000_000, mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/quicktime", "audio/mpeg", "audio/wav"] } },
      { name: "type", type: "select", required: true, options: { values: ["image", "video", "audio", "generated"] } },
      { name: "size", type: "number", required: false, options: { min: 0 } },
      { name: "tags", type: "json", required: false },
      { name: "metadata", type: "json", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
  },

  // ----------------------------------------
  // comments — incoming comments on user's content
  // ----------------------------------------
  {
    name: "comments",
    type: "base",
    singularLabel: "Comment",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "social_account", type: "relation", required: true, options: { collectionId: "social_accounts", maxSelect: 1, cascade: "null" } },
      { name: "post", type: "relation", required: false, options: { collectionId: "posts", maxSelect: 1, cascade: "null" } },
      { name: "external_id", type: "text", required: false },
      { name: "author", type: "text", required: true },
      { name: "author_avatar", type: "url", required: false },
      { name: "content", type: "text", required: true },
      { name: "post_title", type: "text", required: false },
      { name: "ai_reply", type: "text", required: false },
      { name: "status", type: "select", required: true, options: { values: ["new", "analyzed", "queued", "approved", "rejected", "published", "failed"] } },
      { name: "confidence", type: "number", required: false, options: { min: 0, max: 1 } },
      { name: "received_at", type: "date", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''", // webhook-creatable
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
  },

  // ----------------------------------------
  // comment_actions — audit log of every AI comment action
  // ----------------------------------------
  {
    name: "comment_actions",
    type: "base",
    singularLabel: "Comment Action",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "comment", type: "relation", required: true, options: { collectionId: "comments", maxSelect: 1, cascade: "delete" } },
      { name: "automation", type: "relation", required: false, options: { collectionId: "automations", maxSelect: 1, cascade: "null" } },
      { name: "action", type: "select", required: true, options: { values: ["generated", "approved", "rejected", "published", "failed", "flagged"] } },
      { name: "result", type: "text", required: false },
      { name: "error", type: "text", required: false },
      { name: "performed_by", type: "relation", required: false, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: "workspace.owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // automations — workflow definitions
  // ----------------------------------------
  {
    name: "automations",
    type: "base",
    singularLabel: "Automation",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "created_by", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "name", type: "text", required: true },
      { name: "trigger", type: "text", required: true }, // e.g. "new_content_detected"
      { name: "trigger_config", type: "json", required: false },
      { name: "conditions", type: "json", required: false }, // array of conditions
      { name: "actions", type: "json", required: true }, // array of action objects
      { name: "status", type: "select", required: true, options: { values: ["active", "paused", "failed", "draft"] } },
      { name: "rate_limits", type: "json", required: false }, // { max_per_day, max_per_hour, min_delay_seconds }
      { name: "last_execution", type: "date", required: false },
      { name: "run_count", type: "number", required: false, options: { min: 0 } },
      { name: "error_count", type: "number", required: false, options: { min: 0 } },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
  },

  // ----------------------------------------
  // automation_runs — execution history
  // ----------------------------------------
  {
    name: "automation_runs",
    type: "base",
    singularLabel: "Automation Run",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "automation", type: "relation", required: true, options: { collectionId: "automations", maxSelect: 1, cascade: "delete" } },
      { name: "status", type: "select", required: true, options: { values: ["queued", "processing", "completed", "failed", "retrying", "cancelled"] } },
      { name: "trigger_data", type: "json", required: false },
      { name: "result", type: "json", required: false },
      { name: "error", type: "text", required: false },
      { name: "started_at", type: "date", required: false },
      { name: "finished_at", type: "date", required: false },
      { name: "duration_ms", type: "number", required: false, options: { min: 0 } },
      { name: "retry_count", type: "number", required: false, options: { min: 0 } },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: "workspace.owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // schedules — recurring schedule rules
  // ----------------------------------------
  {
    name: "schedules",
    type: "base",
    singularLabel: "Schedule",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "post", type: "relation", required: false, options: { collectionId: "posts", maxSelect: 1, cascade: "null" } },
      { name: "cron", type: "text", required: false },
      { name: "next_run", type: "date", required: false },
      { name: "last_run", type: "date", required: false },
      { name: "status", type: "select", required: true, options: { values: ["active", "paused", "completed", "failed"] } },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
  },

  // ----------------------------------------
  // analytics — recorded metrics per post/account/day
  // ----------------------------------------
  {
    name: "analytics",
    type: "base",
    singularLabel: "Analytics Record",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "social_account", type: "relation", required: false, options: { collectionId: "social_accounts", maxSelect: 1, cascade: "null" } },
      { name: "post", type: "relation", required: false, options: { collectionId: "posts", maxSelect: 1, cascade: "null" } },
      { name: "date", type: "date", required: true },
      { name: "reach", type: "number", required: false, options: { min: 0 } },
      { name: "impressions", type: "number", required: false, options: { min: 0 } },
      { name: "likes", type: "number", required: false, options: { min: 0 } },
      { name: "comments", type: "number", required: false, options: { min: 0 } },
      { name: "shares", type: "number", required: false, options: { min: 0 } },
      { name: "saves", type: "number", required: false, options: { min: 0 } },
      { name: "followers_delta", type: "number", required: false },
      { name: "metadata", type: "json", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''", // webhook-creatable
    updateRule: "workspace.owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // ai_generations — every AI call logged
  // ----------------------------------------
  {
    name: "ai_generations",
    type: "base",
    singularLabel: "AI Generation",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "user", type: "relation", required: true, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "post", type: "relation", required: false, options: { collectionId: "posts", maxSelect: 1, cascade: "null" } },
      { name: "provider", type: "text", required: false }, // "openai", "anthropic", "nexus-default"
      { name: "model", type: "text", required: false },
      { name: "input", type: "json", required: false },
      { name: "output", type: "json", required: false },
      { name: "variants_count", type: "number", required: false, options: { min: 0 } },
      { name: "tokens_used", type: "number", required: false, options: { min: 0 } },
      { name: "duration_ms", type: "number", required: false, options: { min: 0 } },
      { name: "status", type: "select", required: true, options: { values: ["pending", "processing", "completed", "failed"] } },
      { name: "error", type: "text", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: "workspace.owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // approval_queue — items pending human review
  // ----------------------------------------
  {
    name: "approval_queue",
    type: "base",
    singularLabel: "Approval Item",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "post", type: "relation", required: false, options: { collectionId: "posts", maxSelect: 1, cascade: "null" } },
      { name: "post_variant", type: "relation", required: false, options: { collectionId: "post_variants", maxSelect: 1, cascade: "null" } },
      { name: "comment", type: "relation", required: false, options: { collectionId: "comments", maxSelect: 1, cascade: "null" } },
      { name: "type", type: "select", required: true, options: { values: ["post", "caption", "comment", "reply", "script", "other"] } },
      { name: "content", type: "text", required: true },
      { name: "platform", type: "select", required: false, options: { values: ["tiktok", "instagram", "facebook", "youtube", "x", "linkedin", "threads", "pinterest"] } },
      { name: "confidence", type: "number", required: false, options: { min: 0, max: 1 } },
      { name: "status", type: "select", required: true, options: { values: ["pending", "approved", "rejected", "scheduled", "published"] } },
      { name: "reviewer", type: "relation", required: false, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "reviewed_at", type: "date", required: false },
      { name: "review_note", type: "text", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // notifications — user-facing
  // ----------------------------------------
  {
    name: "notifications",
    type: "base",
    singularLabel: "Notification",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "user", type: "relation", required: false, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "type", type: "select", required: true, options: { values: ["success", "info", "warning", "error"] } },
      { name: "category", type: "select", required: false, options: { values: ["publish", "automation", "account", "approval", "rate_limit", "ai", "security", "system"] } },
      { name: "title", type: "text", required: true },
      { name: "description", type: "text", required: false },
      { name: "link", type: "text", required: false },
      { name: "metadata", type: "json", required: false },
      { name: "read", type: "bool", required: false },
      { name: "read_at", type: "date", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id || user = @request.auth.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id || user = @request.auth.id",
    createRule: "@request.auth.id != ''", // server-side can create
    updateRule: "workspace.owner = @request.auth.id || user = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id || user = @request.auth.id",
  },

  // ----------------------------------------
  // usage — counters per workspace per billing cycle
  // ----------------------------------------
  {
    name: "usage",
    type: "base",
    singularLabel: "Usage Record",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "period", type: "text", required: true }, // "2026-10"
      { name: "ai_generations", type: "number", required: false, options: { min: 0 } },
      { name: "posts_published", type: "number", required: false, options: { min: 0 } },
      { name: "comments", type: "number", required: false, options: { min: 0 } },
      { name: "automation_runs", type: "number", required: false, options: { min: 0 } },
      { name: "storage_used_mb", type: "number", required: false, options: { min: 0 } },
      { name: "limits", type: "json", required: false }, // per-plan limits
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: "workspace.owner = @request.auth.id",
    deleteRule: "workspace.owner = @request.auth.id",
  },

  // ----------------------------------------
  // activity_logs — audit trail
  // ----------------------------------------
  {
    name: "activity_logs",
    type: "base",
    singularLabel: "Activity Log",
    fields: [
      { name: "workspace", type: "relation", required: true, options: { collectionId: "workspaces", maxSelect: 1, cascade: "delete" } },
      { name: "user", type: "relation", required: false, options: { collectionId: "users", maxSelect: 1, cascade: "null" } },
      { name: "action", type: "text", required: true }, // e.g. "post.created"
      { name: "entity_type", type: "text", required: false }, // "post", "automation", etc.
      { name: "entity_id", type: "text", required: false },
      { name: "details", type: "json", required: false },
      { name: "ip", type: "text", required: false },
      { name: "user_agent", type: "text", required: false },
    ],
    listRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    viewRule: "workspace.owner = @request.auth.id || workspace.members.id ?@request.relation.members.id",
    createRule: "@request.auth.id != ''",
    updateRule: null, // logs are immutable
    deleteRule: "workspace.owner = @request.auth.id",
  },
];

// ============================================================
// INDEX DEFINITIONS
// ============================================================

export interface IndexDef {
  collection: string;
  name: string;
  fields: string[];   // field names to index
  unique?: boolean;
}

export const indexes: IndexDef[] = [
  // workspaces
  { collection: "workspaces", name: "idx_workspaces_owner", fields: ["owner"] },

  // workspace_members
  { collection: "workspace_members", name: "idx_wm_workspace_user", fields: ["workspace", "user"] },
  { collection: "workspace_members", name: "idx_wm_user", fields: ["user"] },

  // social_accounts
  { collection: "social_accounts", name: "idx_sa_workspace", fields: ["workspace"] },

  // posts
  { collection: "posts", name: "idx_posts_workspace_status", fields: ["workspace", "status"] },
  { collection: "posts", name: "idx_posts_workspace_scheduled", fields: ["workspace", "scheduled_at"] },
  { collection: "posts", name: "idx_posts_workspace_platform", fields: ["workspace", "platform"] },

  // post_variants
  { collection: "post_variants", name: "idx_pv_post", fields: ["post"] },

  // media
  { collection: "media", name: "idx_media_workspace_type", fields: ["workspace", "type"] },

  // comments
  { collection: "comments", name: "idx_comments_workspace_status", fields: ["workspace", "status"] },

  // comment_actions
  { collection: "comment_actions", name: "idx_ca_comment", fields: ["comment"] },

  // automations
  { collection: "automations", name: "idx_aut_workspace_status", fields: ["workspace", "status"] },

  // automation_runs
  { collection: "automation_runs", name: "idx_ar_automation", fields: ["automation"] },

  // schedules
  { collection: "schedules", name: "idx_sched_workspace_status", fields: ["workspace", "status"] },
  { collection: "schedules", name: "idx_sched_next_run", fields: ["next_run"] },

  // analytics
  { collection: "analytics", name: "idx_analytics_workspace_date", fields: ["workspace", "date"] },

  // ai_generations
  { collection: "ai_generations", name: "idx_aig_workspace_status", fields: ["workspace", "status"] },

  // approval_queue
  { collection: "approval_queue", name: "idx_aq_workspace_status", fields: ["workspace", "status"] },

  // notifications
  { collection: "notifications", name: "idx_notif_workspace_read", fields: ["workspace", "read"] },

  // usage
  { collection: "usage", name: "idx_usage_workspace_period", fields: ["workspace", "period"] },

  // activity_logs
  { collection: "activity_logs", name: "idx_al_workspace_created", fields: ["workspace", "created"] },
];

// Note: PocketBase ships with a built-in "users" auth collection — we don't
// redefine it here. The setup script will ensure the users collection has a
// `name` field (added by default) and that's it.
