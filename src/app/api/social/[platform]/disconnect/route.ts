import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { getProviderOrThrow } from "@/lib/social/provider-manager";
import { decryptToken } from "@/lib/social/crypto";

// POST /api/social/[platform]/disconnect
// Revokes OAuth access and deletes the connection.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { platform } = await params;
  const pb = userPbClient(user.token);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // no body
  }

  const accountId = body.accountId as string;
  if (!accountId) {
    return NextResponse.json({ ok: false, error: "accountId is required." }, { status: 400 });
  }

  try {
    // Fetch the social account
    const account = await pb.collection("social_accounts").getOne(accountId);

    // Verify platform matches
    if (account.platform !== platform) {
      return NextResponse.json({ ok: false, error: "Platform mismatch." }, { status: 400 });
    }

    // Verify workspace ownership (the account must belong to a workspace the user owns)
    const workspaceId = account.workspace as string;
    try {
      const ws = await pb.collection("workspaces").getOne(workspaceId);
      if (ws.owner !== user.id) {
        return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Workspace not found." }, { status: 404 });
    }

    // Try to revoke access with the provider
    const provider = getProviderOrThrow(platform);
    try {
      // Fetch the oauth connection
      const conn = await pb.collection("oauth_connections").getFirstListItem(
        `social_account = "${accountId}"`,
      );

      if (conn.access_token) {
        try {
          const accessToken = decryptToken(conn.access_token as string);
          if (provider.revokeAccess) {
            await provider.revokeAccess(accessToken);
          }
        } catch {
          // Token decryption or revocation failed — non-critical, still disconnect locally
        }
      }

      // Delete the oauth connection
      await pb.collection("oauth_connections").delete(conn.id);
    } catch {
      // No oauth connection found — proceed with local cleanup
    }

    // Update social account status
    await pb.collection("social_accounts").update(accountId, {
      status: "disconnected",
      health: 0,
      last_sync: new Date().toISOString(),
    });

    // Create notification
    try {
      await pb.collection("notifications").create({
        workspace: workspaceId,
        user: user.id,
        type: "info",
        category: "account",
        title: `${provider.displayName} disconnected`,
        description: `@${account.username} has been disconnected from your workspace.`,
        read: false,
      });
    } catch {
      // non-critical
    }

    // Create activity log
    try {
      await pb.collection("activity_logs").create({
        workspace: workspaceId,
        user: user.id,
        action: "social_account_disconnected",
        entity_type: "social_account",
        entity_id: accountId,
        details: { platform, username: account.username },
      });
    } catch {
      // non-critical
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
