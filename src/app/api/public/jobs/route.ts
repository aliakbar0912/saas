import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.mughalx.tech";

export async function GET() {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  try {
    const items = await pb.collection("jobs").getFullList({
      filter: "status = 'open'",
      sort: "-created",
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
