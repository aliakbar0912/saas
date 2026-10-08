import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { tryGetQueueBackend, RedisUnavailableError } from "@/lib/redis";

// PATCH /api/posts/[id] — update a post
// DELETE /api/posts/[id] — delete a post
// POST  /api/posts/[id] — publish now (queue a publish job)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const pb = userPbClient(user.token);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const allowed: Record<string, string> = {
    title: "title",
    caption: "caption",
    hashtags: "hashtags",
    cta: "cta",
    tone: "tone",
    language: "language",
    audience: "audience",
    platform: "platform",
    type: "type",
    scheduledAt: "scheduled_at",
    status: "status",
    socialAccountId: "social_account",
    error: "error",
    externalPostId: "external_post_id",
    publishedAt: "published_at",
  };
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowed[key]) update[allowed[key]] = value;
  }

  try {
    const updated = await pb.collection("posts").update(id, update);
    return NextResponse.json({ ok: true, post: { id: updated.id, status: updated.status } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to update post: ${e.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const pb = userPbClient(user.token);

  try {
    await pb.collection("posts").delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to delete post: ${e.message}` },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const pb = userPbClient(user.token);

  try {
    // Mark as processing
    await pb.collection("posts").update(id, { status: "processing", error: null });

    // Enqueue publish job (idempotent: post.id is the job key)
    const queue = tryGetQueueBackend();
    if (!queue) {
      // Redis is not configured at all (REDIS_URL missing).
      // Mark the post as failed with a clear error. Do NOT pretend success.
      await pb.collection("posts").update(id, {
        status: "failed",
        error: "Redis not configured — publishing requires REDIS_URL.",
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Publishing requires REDIS_URL to be configured. Set it in your environment to enable background job processing.",
          requiresRedis: true,
        },
        { status: 503 },
      );
    }

    // Attempt to enqueue. If Redis is unreachable (host doesn't resolve,
    // connection refused, etc.), this throws RedisUnavailableError.
    // We catch it and return a clean 503 — we do NOT pretend the job was queued.
    let jobId: string;
    try {
      jobId = await queue.enqueue("publish:posts", {
        postId: id,
        userId: user.id,
        action: "publish_now",
        timestamp: Date.now(),
      });
    } catch (enqueueErr) {
      const e = enqueueErr as Error;
      // Revert post status to failed with a clear error message
      try {
        await pb.collection("posts").update(id, {
          status: "failed",
          error: `Redis unavailable: ${e.message}`,
        });
      } catch {
        // PocketBase update may also fail if schema isn't set up — non-critical
      }
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to queue publish job: Redis is unavailable. ${e.message}`,
          requiresRedis: true,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      jobId,
      message: "Post queued for publishing.",
    });
  } catch (err) {
    const e = err as Error;
    // This catch is for PocketBase errors (e.g. collection doesn't exist)
    return NextResponse.json(
      { ok: false, error: `Failed to process publish request: ${e.message}` },
      { status: 500 },
    );
  }
}
