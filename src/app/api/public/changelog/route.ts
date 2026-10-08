import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL || "https://pocketbase.mughalx.tech";

// GET /api/public/changelog
export async function GET() {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  try {
    const items = await pb.collection("changelog").getFullList({
      filter: "published = true",
      sort: "-release_date",
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
