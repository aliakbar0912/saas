# Nexus — Complete PocketBase Schema Specification

This document defines every collection, field, relation, and API rule required by the Nexus application. All specifications are derived from the actual source code (`src/lib/pb-schema.ts`, `src/app/api/*/route.ts`, `src/lib/workspace.ts`, `src/lib/hooks/api.ts`).

---

## Authentication Collection

### `users` (Type: Auth — built-in)

PocketBase ships with a built-in `users` auth collection. **Do NOT create a duplicate.** The application uses this collection directly for authentication.

The code references these fields on `users` records:

| Field | Type | Source |
|-------|------|--------|
| `id` | (auto) | `record.id` |
| `email` | email (built-in) | `record.email` |
| `name` | text | `record.name` — used in signup, profile update, profile menu |
| `avatar` | file | `record.avatar` — used in `getAvatarUrl()` |
| `verified` | bool (built-in) | `record.verified` |
| `created` | date (built-in) | `record.created` |
| `updated` | date (built-in) | `record.updated` |

**Signup payload** (from `src/lib/pocketbase.ts` → `signUpWithEmail`):
```json
{ "email": "...", "password": "...", "passwordConfirm": "...", "name": "..." }
```

**Profile update** (from `src/app/api/settings/route.ts`):
```json
{ "name": "..." }
```

---

## Collection 1: `workspaces`

**Type:** Base  
**Purpose:** Top-level tenant. Every user's data belongs to a workspace.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `name` | text | Yes | — | 1 | 100 | — | — | Workspace display name |
| 2 | `slug` | text | No | — | — | 50 | — | — | URL-friendly identifier |
| 3 | `owner` | relation | Yes | — | — | — | 1 | `users` | Cascade: restrict |
| 4 | `plan` | select | No | — | — | — | 1 | — | Values: `free`, `starter`, `pro`, `business` |
| 5 | `logo` | file | No | — | — | 2,000,000 bytes | 1 | — | MIME: `image/png`, `image/jpeg`, `image/svg+xml` |
| 6 | `settings` | json | No | — | — | — | — | — | Workspace settings object |

### API Rules

| Rule | Value |
|------|-------|
| List | `owner = @request.auth.id \|\| members.id ?@request.relation.members.id` |
| View | `owner = @request.auth.id \|\| members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `owner = @request.auth.id` |
| Delete | `owner = @request.auth.id` |

### Code References

- **Create** (`src/lib/workspace.ts:67`): `{ name, owner: userId, plan: "free", settings: {} }`
- **Update** (`src/app/api/workspaces/route.ts:95`): `{ name }`
- **Query** (`src/lib/workspace.ts:36`): `filter: owner = "${userId}"`

---

## Collection 2: `workspace_members`

**Type:** Base  
**Purpose:** Links users to workspaces with a role.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `user` | relation | Yes | — | — | — | 1 | `users` | Cascade: delete |
| 3 | `role` | select | Yes | — | — | — | 1 | — | Values: `owner`, `admin`, `editor`, `approver`, `viewer` |
| 4 | `invited_email` | email | No | — | — | — | — | — | For pending invitations |
| 5 | `status` | select | No | — | — | — | 1 | — | Values: `active`, `pending`, `revoked` |

### API Rules

| Rule | Value |
|------|-------|
| List | `user = @request.auth.id \|\| workspace.owner = @request.auth.id` |
| View | `user = @request.auth.id \|\| workspace.owner = @request.auth.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id \|\| user = @request.auth.id` |

### Code References

- **Create** (`src/lib/workspace.ts:83`): `{ workspace: created.id, user: userId, role: "owner", status: "active" }`
- **Query** (`src/app/api/workspaces/route.ts:21`): `filter: workspace = "${workspace.id}" && status = "active"`

---

## Collection 3: `social_accounts`

**Type:** Base  
**Purpose:** Connected social media platform accounts.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `owner` | relation | Yes | — | — | — | 1 | `users` | Cascade: null |
| 3 | `platform` | select | Yes | — | — | — | 1 | — | Values: `tiktok`, `instagram`, `facebook`, `youtube`, `x`, `linkedin`, `threads`, `pinterest` |
| 4 | `username` | text | Yes | — | — | — | — | — | Platform username |
| 5 | `display_name` | text | No | — | — | — | — | — | Display name |
| 6 | `avatar` | file | No | — | — | 5,000,000 bytes | 1 | — | MIME: `image/png`, `image/jpeg`, `image/webp` |
| 7 | `status` | select | No | — | — | — | 1 | — | Values: `connected`, `expired`, `disconnected`, `error` |
| 8 | `followers` | number | No | — | 0 | — | — | — | Follower count |
| 9 | `permissions` | json | No | — | — | — | — | — | Array of strings: `["Read posts", "Publish video", ...]` |
| 10 | `content_permissions` | json | No | — | — | — | — | — | Array of strings: `["Auto-publish", "Schedule", ...]` |
| 11 | `last_sync` | date | No | — | — | — | — | — | ISO timestamp |
| 12 | `health` | number | No | — | 0 | 100 | — | — | Health score 0-100 |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `workspace.owner = @request.auth.id` |
| Update | `workspace.owner = @request.auth.id \|\| owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id` |

### Code References

- **Create** (`src/app/api/social-accounts/route.ts:85`): `{ workspace, owner, platform, username, display_name, status: "connected", followers: 0, permissions: [], content_permissions: [], last_sync, health: 100 }`
- **Query** (`src/app/api/social-accounts/route.ts:20`): `filter: workspace = "${workspace.id}"`

---

## Collection 4: `oauth_connections`

**Type:** Base  
**Purpose:** Stores OAuth tokens for social accounts. **Tokens NEVER reach the browser.**

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `social_account` | relation | Yes | — | — | — | 1 | `social_accounts` | Cascade: delete |
| 2 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 3 | `provider` | text | Yes | — | — | — | — | — | e.g. "instagram", "tiktok" |
| 4 | `access_token` | text | No | — | — | — | — | — | Encrypted server-side only |
| 5 | `refresh_token` | text | No | — | — | — | — | — | Encrypted server-side only |
| 6 | `expires_at` | date | No | — | — | — | — | — | Token expiry timestamp |
| 7 | `scope` | text | No | — | — | — | — | — | OAuth scope string |
| 8 | `external_id` | text | No | — | — | — | — | — | Platform user ID |

### API Rules

| Rule | Value |
|------|-------|
| List | `null` (admin-only) |
| View | `null` (admin-only) |
| Create | `null` (admin-only) |
| Update | `null` (admin-only) |
| Delete | `null` (admin-only) |

**IMPORTANT:** All rules are `null` — this collection is ONLY accessible via the server-side admin client. Client-side requests get nothing.

---

## Collection 5: `posts`

**Type:** Base  
**Purpose:** Content lifecycle (draft → scheduled → published).

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `author` | relation | Yes | — | — | — | 1 | `users` | Cascade: null |
| 3 | `social_account` | relation | No | — | — | — | 1 | `social_accounts` | Cascade: null |
| 4 | `platform` | select | Yes | — | — | — | 1 | — | Values: `tiktok`, `instagram`, `facebook`, `youtube`, `x`, `linkedin`, `threads`, `pinterest` |
| 5 | `type` | text | No | — | — | — | — | — | Content type: `post`, `caption`, `reel`, `tiktok-script`, etc. |
| 6 | `title` | text | Yes | — | — | — | — | — | Post title |
| 7 | `caption` | text | No | — | — | — | — | — | Post caption/body |
| 8 | `hashtags` | json | No | — | — | — | — | — | Array of strings: `["#ai", "#productivity"]` |
| 9 | `cta` | text | No | — | — | — | — | — | Call-to-action text |
| 10 | `media` | json | No | — | — | — | — | — | Array of media IDs |
| 11 | `scheduled_at` | date | No | — | — | — | — | — | When the post is scheduled to publish |
| 12 | `published_at` | date | No | — | — | — | — | — | When the post was actually published |
| 13 | `status` | select | Yes | — | — | — | 1 | — | Values: `draft`, `pending_approval`, `scheduled`, `processing`, `published`, `failed`, `cancelled` |
| 14 | `error` | text | No | — | — | — | — | — | Error message if status is "failed" |
| 15 | `external_post_id` | text | No | — | — | — | — | — | ID returned by the platform after publishing |
| 16 | `tone` | text | No | — | — | — | — | — | AI tone used (e.g. "Professional") |
| 17 | `language` | text | No | — | — | — | — | — | Content language (e.g. "English") |
| 18 | `audience` | text | No | — | — | — | — | — | Target audience (e.g. "Developers") |
| 19 | `metadata` | json | No | — | — | — | — | — | Additional metadata object |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Update | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Delete | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |

### Code References

- **Create** (`src/app/api/posts/route.ts:126`): `{ workspace, author, social_account, platform, type, title, caption, hashtags, cta, tone, language, audience, scheduled_at, status }`
- **Update** (`src/app/api/posts/[id]/route.ts:51`): allowed fields: `title, caption, hashtags, cta, tone, language, audience, platform, type, scheduled_at, status, social_account, error, external_post_id, published_at`
- **Query** (`src/app/api/posts/route.ts:35`): `filter: status = "..." && platform = "..." && title ~ "..."`, `sort: -created`, `expand: social_account`

---

## Collection 6: `post_variants`

**Type:** Base  
**Purpose:** AI-generated content variants for a post.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `post` | relation | Yes | — | — | — | 1 | `posts` | Cascade: delete |
| 2 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 3 | `label` | text | No | — | — | — | — | — | e.g. "Variant A", "Variant B" |
| 4 | `tone` | text | No | — | — | — | — | — | Tone strategy used |
| 5 | `content` | text | Yes | — | — | — | — | — | The actual generated text |
| 6 | `hashtags` | json | No | — | — | — | — | — | Array of strings |
| 7 | `predicted_engagement` | text | No | — | — | — | — | — | e.g. "High", "Medium", "Very High" |
| 8 | `confidence` | number | No | — | 0 | 1 | — | — | AI confidence score 0.0-1.0 |
| 9 | `is_selected` | bool | No | — | — | — | — | — | Whether this variant was selected |

### API Rules

Same as posts (workspace-scoped, all members can CRUD).

---

## Collection 7: `media`

**Type:** Base  
**Purpose:** Uploaded/generated media assets.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `uploaded_by` | relation | Yes | — | — | — | 1 | `users` | Cascade: null |
| 3 | `name` | text | Yes | — | — | — | — | — | File name |
| 4 | `file` | file | Yes | — | — | 100,000,000 bytes | 1 | — | MIME: `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `video/mp4`, `video/quicktime`, `audio/mpeg`, `audio/wav` |
| 5 | `type` | select | Yes | — | — | — | 1 | — | Values: `image`, `video`, `audio`, `generated` |
| 6 | `size` | number | No | — | 0 | — | — | — | File size in bytes |
| 7 | `tags` | json | No | — | — | — | — | — | Array of strings |
| 8 | `metadata` | json | No | — | — | — | — | — | Additional metadata |

### API Rules

Same as posts (workspace-scoped, all members can CRUD).

### Code References

- **Create** (`src/app/api/media/route.ts:83`): FormData with `workspace, uploaded_by, name, type, size, tags, file`
- **File URL** (`src/app/api/media/route.ts:43`): `${pb.baseUrl}/api/files/media/${m.id}/${m.file}`

---

## Collection 8: `comments`

**Type:** Base  
**Purpose:** Incoming comments on user's content.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `social_account` | relation | Yes | — | — | — | 1 | `social_accounts` | Cascade: null |
| 3 | `post` | relation | No | — | — | — | 1 | `posts` | Cascade: null |
| 4 | `external_id` | text | No | — | — | — | — | — | Platform comment ID |
| 5 | `author` | text | Yes | — | — | — | — | — | Comment author username |
| 6 | `author_avatar` | url | No | — | — | — | — | — | Author avatar URL |
| 7 | `content` | text | Yes | — | — | — | — | — | Comment text |
| 8 | `post_title` | text | No | — | — | — | — | — | Title of the post being commented on |
| 9 | `ai_reply` | text | No | — | — | — | — | — | AI-generated reply |
| 10 | `status` | select | Yes | — | — | — | 1 | — | Values: `new`, `analyzed`, `queued`, `approved`, `rejected`, `published`, `failed` |
| 11 | `confidence` | number | No | — | 0 | 1 | — | — | AI confidence 0.0-1.0 |
| 12 | `received_at` | date | No | — | — | — | — | — | When the comment was received |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` (webhook-creatable) |
| Update | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Delete | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |

---

## Collection 9: `comment_actions`

**Type:** Base  
**Purpose:** Audit log of every AI comment action.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `comment` | relation | Yes | — | — | — | 1 | `comments` | Cascade: delete |
| 3 | `automation` | relation | No | — | — | — | 1 | `automations` | Cascade: null |
| 4 | `action` | select | Yes | — | — | — | 1 | — | Values: `generated`, `approved`, `rejected`, `published`, `failed`, `flagged` |
| 5 | `result` | text | No | — | — | — | — | — | Action result description |
| 6 | `error` | text | No | — | — | — | — | — | Error message if failed |
| 7 | `performed_by` | relation | No | — | — | — | 1 | `users` | Cascade: null |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id` |

---

## Collection 10: `automations`

**Type:** Base  
**Purpose:** Workflow definitions (trigger → conditions → actions).

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `created_by` | relation | Yes | — | — | — | 1 | `users` | Cascade: null |
| 3 | `name` | text | Yes | — | — | — | — | — | Automation name |
| 4 | `trigger` | text | Yes | — | — | — | — | — | Trigger type (e.g. "New content detected") |
| 5 | `trigger_config` | json | No | — | — | — | — | — | Trigger configuration object |
| 6 | `conditions` | json | No | — | — | — | — | — | Array of condition objects |
| 7 | `actions` | json | Yes | — | — | — | — | — | Array of action objects: `[{"label": "Generate comment"}, ...]` |
| 8 | `status` | select | Yes | — | — | — | 1 | — | Values: `active`, `paused`, `failed`, `draft` |
| 9 | `rate_limits` | json | No | — | — | — | — | — | `{"max_per_day": 50, "max_per_hour": 10, "min_delay_seconds": 45}` |
| 10 | `last_execution` | date | No | — | — | — | — | — | Last run timestamp |
| 11 | `run_count` | number | No | — | 0 | — | — | — | Total runs |
| 12 | `error_count` | number | No | — | 0 | — | — | — | Total errors |

### API Rules

Same as posts (workspace-scoped, all members can CRUD).

### Code References

- **Create** (`src/app/api/automations/route.ts:79`): `{ workspace, created_by, name, trigger, trigger_config, conditions, actions, status, rate_limits, run_count: 0, error_count: 0 }`
- **Update** (`src/app/api/automations/[id]/route.ts:35`): allowed fields: `name, trigger, trigger_config, conditions, actions, status, rate_limits`

---

## Collection 11: `automation_runs`

**Type:** Base  
**Purpose:** Execution history for automations.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `automation` | relation | Yes | — | — | — | 1 | `automations` | Cascade: delete |
| 3 | `status` | select | Yes | — | — | — | 1 | — | Values: `queued`, `processing`, `completed`, `failed`, `retrying`, `cancelled` |
| 4 | `trigger_data` | json | No | — | — | — | — | — | Data that triggered the run |
| 5 | `result` | json | No | — | — | — | — | — | Run result data |
| 6 | `error` | text | No | — | — | — | — | — | Error message if failed |
| 7 | `started_at` | date | No | — | — | — | — | — | Run start timestamp |
| 8 | `finished_at` | date | No | — | — | — | — | — | Run end timestamp |
| 9 | `duration_ms` | number | No | — | 0 | — | — | — | Duration in milliseconds |
| 10 | `retry_count` | number | No | — | 0 | — | — | — | Number of retries |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id` |

---

## Collection 12: `schedules`

**Type:** Base  
**Purpose:** Recurring schedule rules.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `post` | relation | No | — | — | — | 1 | `posts` | Cascade: null |
| 3 | `cron` | text | No | — | — | — | — | — | Cron expression for recurring schedules |
| 4 | `next_run` | date | No | — | — | — | — | — | Next scheduled run |
| 5 | `last_run` | date | No | — | — | — | — | — | Last run timestamp |
| 6 | `status` | select | Yes | — | — | — | 1 | — | Values: `active`, `paused`, `completed`, `failed` |

### API Rules

Same as posts (workspace-scoped, all members can CRUD).

---

## Collection 13: `analytics`

**Type:** Base  
**Purpose:** Recorded metrics per post/account/day.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `social_account` | relation | No | — | — | — | 1 | `social_accounts` | Cascade: null |
| 3 | `post` | relation | No | — | — | — | 1 | `posts` | Cascade: null |
| 4 | `date` | date | Yes | — | — | — | — | — | Date of the metrics |
| 5 | `reach` | number | No | — | 0 | — | — | — | Reach count |
| 6 | `impressions` | number | No | — | 0 | — | — | — | Impression count |
| 7 | `likes` | number | No | — | 0 | — | — | — | Like count |
| 8 | `comments` | number | No | — | 0 | — | — | — | Comment count |
| 9 | `shares` | number | No | — | 0 | — | — | — | Share count |
| 10 | `saves` | number | No | — | 0 | — | — | — | Save count |
| 11 | `followers_delta` | number | No | — | — | — | — | — | Follower change (can be negative) |
| 12 | `metadata` | json | No | — | — | — | — | — | Additional metrics |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` (webhook-creatable) |
| Update | `workspace.owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id` |

### Code References

- **Query** (`src/app/api/analytics/route.ts:24`): `filter: workspace = "${workspace.id}" && date >= "${since}"`, `sort: date`

---

## Collection 14: `ai_generations`

**Type:** Base  
**Purpose:** Log of every AI generation call.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `user` | relation | Yes | — | — | — | 1 | `users` | Cascade: null |
| 3 | `post` | relation | No | — | — | — | 1 | `posts` | Cascade: null |
| 4 | `provider` | text | No | — | — | — | — | — | e.g. "z-ai-default", "openai" |
| 5 | `model` | text | No | — | — | — | — | — | e.g. "glm-4", "gpt-4o-mini" |
| 6 | `input` | json | No | — | — | — | — | — | Input parameters: `{platform, contentType, topic, tone, language, audience, length, cta, hashtags}` |
| 7 | `output` | json | No | — | — | — | — | — | Output: `{variants: [...]}` |
| 8 | `variants_count` | number | No | — | 0 | — | — | — | Number of variants generated |
| 9 | `tokens_used` | number | No | — | 0 | — | — | — | Token usage |
| 10 | `duration_ms` | number | No | — | 0 | — | — | — | Generation duration |
| 11 | `status` | select | Yes | — | — | — | 1 | — | Values: `pending`, `processing`, `completed`, `failed` |
| 12 | `error` | text | No | — | — | — | — | — | Error message if failed |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id` |

### Code References

- **Create** (`src/app/api/ai/generate/route.ts:53`): `{ workspace, user, provider: "default", model: "auto", input: {...}, output: null, variants_count: 0, status: "processing" }`
- **Update (success)** (`src/app/api/ai/generate/route.ts:87`): `{ provider, model, output, variants_count, tokens_used, duration_ms, status: "completed" }`
- **Update (failure)** (`src/app/api/ai/generate/route.ts:133`): `{ status: "failed", error }`

---

## Collection 15: `approval_queue`

**Type:** Base  
**Purpose:** Items pending human review.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `post` | relation | No | — | — | — | 1 | `posts` | Cascade: null |
| 3 | `post_variant` | relation | No | — | — | — | 1 | `post_variants` | Cascade: null |
| 4 | `comment` | relation | No | — | — | — | 1 | `comments` | Cascade: null |
| 5 | `type` | select | Yes | — | — | — | 1 | — | Values: `post`, `caption`, `comment`, `reply`, `script`, `other` |
| 6 | `content` | text | Yes | — | — | — | — | — | Content to review |
| 7 | `platform` | select | No | — | — | — | 1 | — | Values: `tiktok`, `instagram`, `facebook`, `youtube`, `x`, `linkedin`, `threads`, `pinterest` |
| 8 | `confidence` | number | No | — | 0 | 1 | — | — | AI confidence 0.0-1.0 |
| 9 | `status` | select | Yes | — | — | — | 1 | — | Values: `pending`, `approved`, `rejected`, `scheduled`, `published` |
| 10 | `reviewer` | relation | No | — | — | — | 1 | `users` | Cascade: null |
| 11 | `reviewed_at` | date | No | — | — | — | — | — | Review timestamp |
| 12 | `review_note` | text | No | — | — | — | — | — | Reviewer's note |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Delete | `workspace.owner = @request.auth.id` |

### Code References

- **Update** (`src/app/api/approvals/[id]/route.ts:35`): `{ status, review_note, content, reviewer: user.id, reviewed_at: now }`

---

## Collection 16: `notifications`

**Type:** Base  
**Purpose:** User-facing notifications.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `user` | relation | No | — | — | — | 1 | `users` | Cascade: null |
| 3 | `type` | select | Yes | — | — | — | 1 | — | Values: `success`, `info`, `warning`, `error` |
| 4 | `category` | select | No | — | — | — | 1 | — | Values: `publish`, `automation`, `account`, `approval`, `rate_limit`, `ai`, `security`, `system` |
| 5 | `title` | text | Yes | — | — | — | — | — | Notification title |
| 6 | `description` | text | No | — | — | — | — | — | Notification body |
| 7 | `link` | text | No | — | — | — | — | — | Link to related entity |
| 8 | `metadata` | json | No | — | — | — | — | — | Additional data |
| 9 | `read` | bool | No | — | — | — | — | — | Read status |
| 10 | `read_at` | date | No | — | — | — | — | — | When marked as read |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id \|\| user = @request.auth.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id \|\| user = @request.auth.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id \|\| user = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id \|\| user = @request.auth.id` |

### Code References

- **Query** (`src/app/api/notifications/route.ts:23`): `filter: workspace = "${workspace.id}"`, `sort: -created`
- **Mark all read** (`src/app/api/notifications/route.ts:67`): `filter: workspace = "${workspace.id}" && read = false`, then `update(n.id, { read: true, read_at: now })`
- **Mark one read** (`src/app/api/notifications/[id]/route.ts:27`): `update(id, { read: true, read_at })`

---

## Collection 17: `usage`

**Type:** Base  
**Purpose:** Counters per workspace per billing cycle.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `period` | text | Yes | — | — | — | — | — | Billing period: `"2026-10"` (YYYY-MM) |
| 3 | `ai_generations` | number | No | — | 0 | — | — | — | AI generations used |
| 4 | `posts_published` | number | No | — | 0 | — | — | — | Posts published |
| 5 | `comments` | number | No | — | 0 | — | — | — | Comments posted |
| 6 | `automation_runs` | number | No | — | 0 | — | — | — | Automation runs |
| 7 | `storage_used_mb` | number | No | — | 0 | — | — | — | Storage used in MB |
| 8 | `limits` | json | No | — | — | — | — | — | Per-plan limits (see below) |

### `limits` JSON structure

```json
{
  "ai_generations": 50,
  "posts_published": 100,
  "comments": 50,
  "automation_runs": 100,
  "storage_used_mb": 500,
  "connected_accounts": 2
}
```

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `workspace.owner = @request.auth.id` |
| Delete | `workspace.owner = @request.auth.id` |

### Code References

- **Create** (`src/lib/workspace.ts:97` and `src/app/api/usage/route.ts:29`): `{ workspace, period, ai_generations: 0, posts_published: 0, comments: 0, automation_runs: 0, storage_used_mb: 0, limits: {...} }`
- **Query** (`src/app/api/usage/route.ts:22`): `filter: workspace = "${workspace.id}" && period = "${period}"`

---

## Collection 18: `activity_logs`

**Type:** Base  
**Purpose:** Audit trail of all actions.

### Fields

| # | Field Name | PB Type | Required | Default | Min | Max | MaxSelect | Relation Target | Notes |
|---|-----------|---------|----------|---------|-----|-----|-----------|-----------------|-------|
| 1 | `workspace` | relation | Yes | — | — | — | 1 | `workspaces` | Cascade: delete |
| 2 | `user` | relation | No | — | — | — | 1 | `users` | Cascade: null |
| 3 | `action` | text | Yes | — | — | — | — | — | e.g. "post.created", "automation.paused" |
| 4 | `entity_type` | text | No | — | — | — | — | — | e.g. "post", "automation" |
| 5 | `entity_id` | text | No | — | — | — | — | — | ID of the related entity |
| 6 | `details` | json | No | — | — | — | — | — | Additional details |
| 7 | `ip` | text | No | — | — | — | — | — | Request IP address |
| 8 | `user_agent` | text | No | — | — | — | — | — | Request user agent |

### API Rules

| Rule | Value |
|------|-------|
| List | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| View | `workspace.owner = @request.auth.id \|\| workspace.members.id ?@request.relation.members.id` |
| Create | `@request.auth.id != ''` |
| Update | `null` (logs are immutable — no updates allowed) |
| Delete | `workspace.owner = @request.auth.id` |

### Code References

- **Query** (`src/app/api/activity/route.ts:22`): `filter: workspace = "${workspace.id}"`, `sort: -created`, `expand: user`

---

## Relationship Map

```
users (auth)
  │
  ├──< workspaces (owner)
  │     │
  │     ├──< workspace_members (workspace, user)
  │     ├──< social_accounts (workspace, owner)
  │     │     │
  │     │     └──< oauth_connections (social_account, workspace)
  │     ├──< posts (workspace, author, social_account)
  │     │     │
  │     │     ├──< post_variants (post, workspace)
  │     │     ├──< comments (workspace, social_account, post)
  │     │     │     │
  │     │     │     └──< comment_actions (workspace, comment, automation)
  │     │     ├──< schedules (workspace, post)
  │     │     └──< analytics (workspace, social_account, post)
  │     ├──< automations (workspace, created_by)
  │     │     │
  │     │     └──< automation_runs (workspace, automation)
  │     ├──< media (workspace, uploaded_by)
  │     ├──< ai_generations (workspace, user, post)
  │     ├──< approval_queue (workspace, post, post_variant, comment)
  │     ├──< notifications (workspace, user)
  │     ├──< usage (workspace)
  │     └──< activity_logs (workspace, user)
```

### All Relations Summary

| From Collection | Field | → Target Collection | Cascade | Max Select |
|----------------|-------|---------------------|---------|------------|
| workspaces | owner | users | restrict | 1 |
| workspace_members | workspace | workspaces | delete | 1 |
| workspace_members | user | users | delete | 1 |
| social_accounts | workspace | workspaces | delete | 1 |
| social_accounts | owner | users | null | 1 |
| oauth_connections | social_account | social_accounts | delete | 1 |
| oauth_connections | workspace | workspaces | delete | 1 |
| posts | workspace | workspaces | delete | 1 |
| posts | author | users | null | 1 |
| posts | social_account | social_accounts | null | 1 |
| post_variants | post | posts | delete | 1 |
| post_variants | workspace | workspaces | delete | 1 |
| media | workspace | workspaces | delete | 1 |
| media | uploaded_by | users | null | 1 |
| comments | workspace | workspaces | delete | 1 |
| comments | social_account | social_accounts | null | 1 |
| comments | post | posts | null | 1 |
| comment_actions | workspace | workspaces | delete | 1 |
| comment_actions | comment | comments | delete | 1 |
| comment_actions | automation | automations | null | 1 |
| comment_actions | performed_by | users | null | 1 |
| automations | workspace | workspaces | delete | 1 |
| automations | created_by | users | null | 1 |
| automation_runs | workspace | workspaces | delete | 1 |
| automation_runs | automation | automations | delete | 1 |
| schedules | workspace | workspaces | delete | 1 |
| schedules | post | posts | null | 1 |
| analytics | workspace | workspaces | delete | 1 |
| analytics | social_account | social_accounts | null | 1 |
| analytics | post | posts | null | 1 |
| ai_generations | workspace | workspaces | delete | 1 |
| ai_generations | user | users | null | 1 |
| ai_generations | post | posts | null | 1 |
| approval_queue | workspace | workspaces | delete | 1 |
| approval_queue | post | posts | null | 1 |
| approval_queue | post_variant | post_variants | null | 1 |
| approval_queue | comment | comments | null | 1 |
| approval_queue | reviewer | users | null | 1 |
| notifications | workspace | workspaces | delete | 1 |
| notifications | user | users | null | 1 |
| usage | workspace | workspaces | delete | 1 |
| activity_logs | workspace | workspaces | delete | 1 |
| activity_logs | user | users | null | 1 |

---

## Recommended Indexes

Create these indexes in the PocketBase admin UI for performance:

| Collection | Index Fields | Purpose |
|-----------|-------------|---------|
| workspaces | `owner` | Find workspaces by owner |
| workspace_members | `workspace` + `user` | Check membership |
| workspace_members | `user` | Find user's workspaces |
| social_accounts | `workspace` | List accounts in workspace |
| posts | `workspace` + `status` | Filter posts by status |
| posts | `workspace` + `scheduled_at` | Calendar view |
| posts | `workspace` + `platform` | Filter by platform |
| post_variants | `post` | Get variants for a post |
| media | `workspace` + `type` | Filter media by type |
| comments | `workspace` + `status` | Filter comments by status |
| comment_actions | `comment` | Get actions for a comment |
| automations | `workspace` + `status` | Filter automations |
| automation_runs | `automation` | Get runs for an automation |
| schedules | `workspace` + `status` | Active schedules |
| schedules | `next_run` | Find due schedules |
| analytics | `workspace` + `date` | Time-series queries |
| ai_generations | `workspace` + `status` | Track pending generations |
| approval_queue | `workspace` + `status` | Pending approvals |
| notifications | `workspace` + `read` | Unread notifications |
| usage | `workspace` + `period` | Current billing cycle |
| activity_logs | `workspace` + `created` | Recent activity feed |

---

## Field Naming Convention

PocketBase stores fields with snake_case in the database. The API routes convert between:
- **Camelcase** (frontend/API responses): `displayName`, `scheduledAt`, `lastSync`
- **Snake_case** (PocketBase field names): `display_name`, `scheduled_at`, `last_sync`

### Field Mapping (API → PocketBase)

| API Field (camelCase) | PocketBase Field (snake_case) |
|----------------------|------------------------------|
| displayName | display_name |
| scheduledAt | scheduled_at |
| publishedAt | published_at |
| socialAccountId | social_account |
| lastSync | last_sync |
| lastExecution | last_execution |
| runCount | run_count |
| errorCount | error_count |
| triggerConfig | trigger_config |
| rateLimits | rate_limits |
| postTitle | post_title |
| aiReply | ai_reply |
| receivedAt | received_at |
| performedBy | performed_by |
| externalPostId | external_post_id |
| postVariant | post_variant |
| reviewedAt | reviewed_at |
| reviewNote | review_note |
| variantsCount | variants_count |
| tokensUsed | tokens_used |
| durationMs | duration_ms |
| triggerData | trigger_data |
| startedAt | started_at |
| finishedAt | finished_at |
| retryCount | retry_count |
| followersDelta | followers_delta |
| storageUsedMb | storage_used_mb |
| postsPublished | posts_published |
| automationRuns | automation_runs |
| aiGenerations | ai_generations |
| contentPermissions | content_permissions |
| uploadedBy | uploaded_by |
| createdBy | created_by |
| entityId | entity_id |
| entityType | entity_type |
| userAgent | user_agent |
| readAt | read_at |

---

## Creation Order

Create collections in this order (relations must exist before being referenced):

1. `users` (already exists — built-in auth collection)
2. `workspaces` (references `users`)
3. `workspace_members` (references `workspaces`, `users`)
4. `social_accounts` (references `workspaces`, `users`)
5. `oauth_connections` (references `social_accounts`, `workspaces`)
6. `posts` (references `workspaces`, `users`, `social_accounts`)
7. `post_variants` (references `posts`, `workspaces`)
8. `media` (references `workspaces`, `users`)
9. `automations` (references `workspaces`, `users`)
10. `comments` (references `workspaces`, `social_accounts`, `posts`)
11. `comment_actions` (references `workspaces`, `comments`, `automations`, `users`)
12. `automation_runs` (references `workspaces`, `automations`)
13. `schedules` (references `workspaces`, `posts`)
14. `analytics` (references `workspaces`, `social_accounts`, `posts`)
15. `ai_generations` (references `workspaces`, `users`, `posts`)
16. `approval_queue` (references `workspaces`, `posts`, `post_variants`, `comments`, `users`)
17. `notifications` (references `workspaces`, `users`)
18. `usage` (references `workspaces`)
19. `activity_logs` (references `workspaces`, `users`)

---

## Summary

| # | Collection | Type | Fields | Relations |
|---|-----------|------|--------|-----------|
| 0 | users | Auth (built-in) | 6 | — |
| 1 | workspaces | Base | 6 | 1 (users) |
| 2 | workspace_members | Base | 5 | 2 (workspaces, users) |
| 3 | social_accounts | Base | 12 | 2 (workspaces, users) |
| 4 | oauth_connections | Base | 8 | 2 (social_accounts, workspaces) |
| 5 | posts | Base | 19 | 3 (workspaces, users, social_accounts) |
| 6 | post_variants | Base | 9 | 2 (posts, workspaces) |
| 7 | media | Base | 8 | 2 (workspaces, users) |
| 8 | comments | Base | 12 | 3 (workspaces, social_accounts, posts) |
| 9 | comment_actions | Base | 7 | 4 (workspaces, comments, automations, users) |
| 10 | automations | Base | 12 | 2 (workspaces, users) |
| 11 | automation_runs | Base | 10 | 2 (workspaces, automations) |
| 12 | schedules | Base | 6 | 2 (workspaces, posts) |
| 13 | analytics | Base | 12 | 3 (workspaces, social_accounts, posts) |
| 14 | ai_generations | Base | 12 | 3 (workspaces, users, posts) |
| 15 | approval_queue | Base | 12 | 5 (workspaces, posts, post_variants, comments, users) |
| 16 | notifications | Base | 10 | 2 (workspaces, users) |
| 17 | usage | Base | 8 | 1 (workspaces) |
| 18 | activity_logs | Base | 8 | 2 (workspaces, users) |

**Total:** 19 collections (1 built-in auth + 18 custom base), 166 fields, 39 relations.
