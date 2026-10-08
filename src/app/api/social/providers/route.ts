import { NextRequest, NextResponse } from "next/server";
import { getAllProviderStatuses } from "@/lib/social/provider-manager";

// GET /api/social/providers
// Returns the configuration status of all social providers.
// Used by the Social Accounts UI to show which platforms are available.
export async function GET(_req: NextRequest) {
  const providers = getAllProviderStatuses();
  return NextResponse.json({ ok: true, providers });
}
