import { NextRequest, NextResponse } from "next/server";
import { getMigrationStatus, migrateSchema } from "@/lib/pb-migrate";
import { getRequestUser } from "@/lib/server-auth";

// GET /api/admin/setup — returns migration status
// POST /api/admin/setup — runs the migration (admin-only — requires server-side admin credentials)

export async function GET(_req: NextRequest) {
  const user = await getRequestUser(_req as unknown as Request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  const status = await getMigrationStatus();
  return NextResponse.json(status);
}

export async function POST(_req: NextRequest) {
  const user = await getRequestUser(_req as unknown as Request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  const result = await migrateSchema();
  return NextResponse.json(result);
}
