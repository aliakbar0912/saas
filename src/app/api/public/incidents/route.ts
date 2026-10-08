import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.mughalx.tech";

// GET /api/public/incidents — list published incidents
export async function GET() {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  try {
    const items = await pb.collection("incidents").getFullList({
      filter: "published = true",
      sort: "-created",
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
