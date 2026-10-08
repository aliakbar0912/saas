import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/posts?status=scheduled&platform=instagram&page=1&perPage=20&q=search
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json({ ok: true, items: [], schemaSetupRequired: true });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = parseInt(url.searchParams.get("perPage") || "50");
  const status = url.searchParams.get("status");
  const platform = url.searchParams.get("platform");
  const q = url.searchParams.get("q");

  const filters: string[] = [];
  if (status && status !== "all") filters.push(`status = "${status}"`);
  if (platform && platform !== "all") filters.push(`platform = "${platform}"`);
  if (q) {
    // PocketBase text search
    filters.push(`title ~ "${q.replace(/"/g, "")}" || caption ~ "${q.replace(/"/g, "")}"`);
  }

  try {
    const res = await pb.collection("posts").getList(page, perPage, {
      sort: "-created",
      filter: filters.join(" && "),
      expand: "social_account",
    });
    return NextResponse.json({
      ok: true,
      items: res.items.map((p) => ({
        id: p.id,
        platform: p.platform,
        type: p.type,
        title: p.title,
        caption: p.caption,
        hashtags: p.hashtags || [],
        cta: p.cta,
        scheduledAt: p.scheduled_at,
        publishedAt: p.published_at,
        status: p.status,
        error: p.error,
        socialAccount: p.expand?.social_account
          ? {
              id: p.expand.social_account.id,
              platform: p.expand.social_account.platform,
              username: p.expand.social_account.username,
              displayName: p.expand.social_account.display_name,
            }
          : null,
        tone: p.tone,
        language: p.language,
        audience: p.audience,
        created: p.created,
        updated: p.updated,
      })),
      page: res.page,
      perPage: res.perPage,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to fetch posts: ${e.message}` },
      { status: 500 },
    );
  }
}

// POST /api/posts — create a new post
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    platform,
    type,
    title,
    caption,
    hashtags,
    cta,
    tone,
    language,
    audience,
    socialAccountId,
    scheduledAt,
    status,
  } = body;

  if (!platform || !title) {
    return NextResponse.json(
      { ok: false, error: "platform and title are required." },
      { status: 400 },
    );
  }

  if (!workspace) {
    return NextResponse.json({ ok: false, error: "Schema not configured. Run: bun run pb:setup", schemaSetupRequired: true }, { status: 503 });
  }

  try {
    const created = await pb.collection("posts").create({
      workspace: workspace.id,
      author: user.id,
      social_account: socialAccountId || null,
      platform,
      type: type || "post",
      title,
      caption: caption || "",
      hashtags: hashtags || [],
      cta: cta || "",
      tone: tone || "",
      language: language || "English",
      audience: audience || "",
      scheduled_at: scheduledAt || null,
      status: status || "draft",
    });

    return NextResponse.json({
      ok: true,
      post: {
        id: created.id,
        platform: created.platform,
        title: created.title,
        status: created.status,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to create post: ${e.message}` },
      { status: 500 },
    );
  }
}
