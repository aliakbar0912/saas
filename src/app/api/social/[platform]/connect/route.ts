import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";
import { getProviderOrThrow } from "@/lib/social/provider-manager";
import { generateOAuthState } from "@/lib/social/state-manager";

// GET /api/social/[platform]/connect
// Initiates the OAuth flow — redirects the user to the provider's
// authorization page.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.redirect(new URL("/?auth=required", req.url));
  }

  const { platform } = await params;
  let provider;
  try {
    provider = getProviderOrThrow(platform);
  } catch {
    return NextResponse.json({ ok: false, error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: `${provider.displayName} is not configured. Required env vars: ${provider.getRequiredEnvVars().join(", ")}`,
      },
      { status: 503 },
    );
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json(
      { ok: false, error: "Workspace not available. Run: bun run pb:setup" },
      { status: 503 },
    );
  }

  // Generate OAuth state and store in Redis
  let state: string;
  try {
    state = await generateOAuthState(user.id, workspace.id, platform);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to generate OAuth state. Redis is required." },
      { status: 503 },
    );
  }

  // Generate authorization URL
  const authUrl = provider.createAuthorizationUrl(state);

  // Redirect user to provider
  return NextResponse.redirect(authUrl);
}
