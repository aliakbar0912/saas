import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { getProviderOrThrow } from "@/lib/social/provider-manager";
import { validateOAuthState } from "@/lib/social/state-manager";
import { encryptToken } from "@/lib/social/crypto";
import { platformMeta } from "@/lib/platforms";

// GET /api/social/[platform]/callback
// Handles the OAuth callback — validates state, exchanges code for
// tokens, fetches account info, and saves to PocketBase.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  // Determine redirect URL for the frontend
  // Use NEXT_PUBLIC_APP_URL (the real public domain) because url.origin
  // may be an internal hostname when behind a reverse proxy.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const accountsUrl = `${appUrl}/#accounts`;

  // OAuth denied by user
  if (error) {
    return NextResponse.redirect(`${accountsUrl}?oauth_error=${encodeURIComponent(errorDesc || error)}`);
  }

  // Missing code or state
  if (!code || !state) {
    return NextResponse.redirect(`${accountsUrl}?oauth_error=missing_code_or_state`);
  }

  // Validate OAuth state
  const stateData = await validateOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(`${accountsUrl}?oauth_error=invalid_or_expired_state`);
  }

  // Verify platform matches
  if (stateData.platform !== platform) {
    return NextResponse.redirect(`${accountsUrl}?oauth_error=platform_mismatch`);
  }

  // Get provider
  let provider;
  try {
    provider = getProviderOrThrow(platform);
  } catch {
    return NextResponse.redirect(`${accountsUrl}?oauth_error=unknown_platform`);
  }

  // Authenticate user (must be the same user who initiated the flow)
  const user = await getRequestUser(req as unknown as Request);
  if (!user || user.id !== stateData.userId) {
    return NextResponse.redirect(`${accountsUrl}?oauth_error=user_mismatch`);
  }

  const pb = userPbClient(user.token);

  try {
    // Exchange code for tokens + fetch account info
    const result = await provider.exchangeCode(code);

    // Encrypt sensitive tokens before storing
    const encryptedAccessToken = encryptToken(result.tokens.accessToken);
    const encryptedRefreshToken = result.tokens.refreshToken
      ? encryptToken(result.tokens.refreshToken)
      : null;

    // Check for existing account (by external_id to avoid duplicates)
    let socialAccountId: string;
    let isReconnect = false;

    try {
      const existing = await pb.collection("social_accounts").getFirstListItem(
        `workspace = "${stateData.workspaceId}" && platform = "${platform}" && username = "${result.account.username}"`,
      );

      // Update existing account
      socialAccountId = existing.id;
      isReconnect = true;
      await pb.collection("social_accounts").update(socialAccountId, {
        username: result.account.username,
        display_name: result.account.displayName,
        status: "connected",
        followers: result.account.followers ?? 0,
        permissions: result.account.permissions,
        content_permissions: [],
        last_sync: new Date().toISOString(),
        health: 100,
      });

      // Update oauth_connections
      try {
        const existingConn = await pb.collection("oauth_connections").getFirstListItem(
          `social_account = "${socialAccountId}"`,
        );
        await pb.collection("oauth_connections").update(existingConn.id, {
          provider: platform,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: result.tokens.expiresAt || null,
          scope: result.tokens.scope || null,
          external_id: result.account.externalId,
        });
      } catch {
        // Create new connection record
        await pb.collection("oauth_connections").create({
          social_account: socialAccountId,
          workspace: stateData.workspaceId,
          provider: platform,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: result.tokens.expiresAt || null,
          scope: result.tokens.scope || null,
          external_id: result.account.externalId,
        });
      }
    } catch {
      // Account doesn't exist — create new
      const created = await pb.collection("social_accounts").create({
        workspace: stateData.workspaceId,
        owner: user.id,
        platform,
        username: result.account.username,
        display_name: result.account.displayName,
        status: "connected",
        followers: result.account.followers ?? 0,
        permissions: result.account.permissions,
        content_permissions: [],
        last_sync: new Date().toISOString(),
        health: 100,
      });

      socialAccountId = created.id;

      // Create oauth_connections record
      await pb.collection("oauth_connections").create({
        social_account: socialAccountId,
        workspace: stateData.workspaceId,
        provider: platform,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: result.tokens.expiresAt || null,
        scope: result.tokens.scope || null,
        external_id: result.account.externalId,
      });
    }

    // Create notification
    try {
      await pb.collection("notifications").create({
        workspace: stateData.workspaceId,
        user: user.id,
        type: "success",
        category: "account",
        title: isReconnect ? `${provider.displayName} reconnected` : `${provider.displayName} connected`,
        description: `@${result.account.username} is now ${isReconnect ? "reconnected" : "connected"} to your workspace.`,
        read: false,
      });
    } catch {
      // notification is non-critical
    }

    // Create activity log
    try {
      await pb.collection("activity_logs").create({
        workspace: stateData.workspaceId,
        user: user.id,
        action: isReconnect ? "social_account_reconnected" : "social_account_connected",
        entity_type: "social_account",
        entity_id: socialAccountId,
        details: { platform, username: result.account.username },
      });
    } catch {
      // log is non-critical
    }

    return NextResponse.redirect(`${accountsUrl}?oauth_success=${platform}`);
  } catch (err) {
    const e = err as Error;
    // Create error notification
    try {
      await pb.collection("notifications").create({
        workspace: stateData.workspaceId,
        user: user.id,
        type: "error",
        category: "account",
        title: `${provider.displayName} connection failed`,
        description: e.message,
        read: false,
      });
    } catch {
      // non-critical
    }

    return NextResponse.redirect(
      `${accountsUrl}?oauth_error=${encodeURIComponent(e.message)}`,
    );
  }
}
