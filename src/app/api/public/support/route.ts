import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.mughalx.tech";

// GET /api/public/support — list user's tickets
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const pb = userPbClient(user.token);
  try {
    const items = await pb.collection("support_tickets").getFullList({
      filter: `user = "${user.id}"`,
      sort: "-created",
    });
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

// POST /api/public/support — create ticket
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const { subject, description, category, priority } = body;
  if (!subject || !description) {
    return NextResponse.json({ ok: false, error: "Subject and description are required." }, { status: 400 });
  }

  const pb = userPbClient(user.token);
  try {
    const ticket = await pb.collection("support_tickets").create({
      user: user.id,
      subject, description,
      category: category || "general",
      priority: priority || "normal",
      status: "open",
      replies: [],
    });
    return NextResponse.json({ ok: true, ticket: { id: ticket.id } });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
