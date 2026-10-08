import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.mughalx.tech";

// GET /api/public/blog — list published posts
// GET /api/public/blog?slug=... — get single post by slug
export async function GET(req: NextRequest) {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  try {
    if (slug) {
      const post = await pb.collection("blog_posts").getFirstListItem(`slug = "${slug}" && status = 'published'`);
      return NextResponse.json({ ok: true, post });
    }
    const items = await pb.collection("blog_posts").getFullList({
      filter: "status = 'published'",
      sort: "-published_at",
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [], post: null });
  }
}
