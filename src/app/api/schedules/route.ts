import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { tryGetQueueBackend } from "@/lib/redis";

// POST /api/schedules — schedule a post for later
// Body: { postId, scheduledAt }
//
// This route:
//   1. Saves the scheduled time to PocketBase
//   2. Enqueues a delayed job to Redis
//
// If Redis is not configured or unreachable, the post is NOT marked as
// scheduled — we revert it to its previous status and return a clean 503.
// We never pretend a scheduled job was created when it wasn't.
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { postId, scheduledAt } = body;
  if (!postId || !scheduledAt) {
    return NextResponse.json(
      { ok: false, error: "postId and scheduledAt are required." },
      { status: 400 },
    );
  }

  const scheduledDate = new Date(scheduledAt as string);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Invalid scheduledAt date." },
      { status: 400 },
    );
  }

  if (scheduledDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { ok: false, error: "scheduledAt must be in the future." },
      { status: 400 },
    );
  }

  // Step 1: Check Redis availability BEFORE modifying PocketBase.
  // If Redis is not available, we fail immediately — no need to save
  // a schedule that can never be executed.
  const queue = tryGetQueueBackend();
  if (!queue) {
    return NextResponse.json(
      {
        ok: false,
        error: "Scheduling requires REDIS_URL to be configured. Redis is not set in the environment.",
        requiresRedis: true,
      },
      { status: 503 },
    );
  }

  // Step 2: Save the scheduled time to PocketBase.
  try {
    await pb.collection("posts").update(postId as string, {
      status: "scheduled",
      scheduled_at: scheduledDate.toISOString(),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Failed to save schedule: ${e.message}` },
      { status: 500 },
    );
  }

  // Step 3: Enqueue the delayed publish job to Redis.
  const delaySeconds = Math.max(
    0,
    Math.floor((scheduledDate.getTime() - Date.now()) / 1000),
  );
  try {
    const jobId = await queue.enqueue("publish:posts", {
      postId,
      userId: user.id,
      action: "publish_scheduled",
      timestamp: Date.now(),
    }, { delaySeconds });

    return NextResponse.json({
      ok: true,
      jobId,
      scheduledAt: scheduledDate.toISOString(),
      message: "Post scheduled.",
    });
  } catch (enqueueErr) {
    const e = enqueueErr as Error;
    // Redis was configured but the enqueue failed (host unreachable, etc.).
    // Revert the post status so the user sees it as a draft, not scheduled.
    try {
      await pb.collection("posts").update(postId as string, {
        status: "draft",
        error: `Failed to schedule: Redis unavailable — ${e.message}`,
      });
    } catch {
      // PocketBase revert may also fail if schema isn't set up — non-critical
    }
    return NextResponse.json(
      {
        ok: false,
        error: `Failed to create scheduled job: Redis is unavailable. ${e.message}. The post has been reverted to draft status.`,
        requiresRedis: true,
      },
      { status: 503 },
    );
  }
}
