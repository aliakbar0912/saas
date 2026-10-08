import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.mughalx.tech";

// GET /api/public/community — list posts
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    // Public read not allowed — community requires auth
    const pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
    try {
      const items = await pb.collection("community_posts").getFullList({
        sort: "-created",
        expand: "author",
      });
      return NextResponse.json({ ok: true, items });
    } catch {
      return NextResponse.json({ ok: true, items: [] });
    }
  }
  const pb = userPbClient(user.token);
  try {
    const items = await pb.collection("community_posts").getFullList({
      sort: "-created",
      expand: "author",
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

// POST /api/public/community — create post
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const { title, content, category, tags } = body;
  if (!title || !content || !category) {
    return NextResponse.json({ ok: false, error: "Title, content, and category are required." }, { status: 400 });
  }

  const pb = userPbClient(user.token);
  try {
    const post = await pb.collection("community_posts").create({
      author: user.id, title, content, category,
      tags: tags || [], likes: 0, comments_count: 0, pinned: false,
    });
    return NextResponse.json({ ok: true, post: { id: post.id } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
