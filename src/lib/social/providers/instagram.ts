import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig, PublishParams, PublishResult } from "../types";

// ============================================================
// Instagram Provider — Instagram Graph API via Meta OAuth
// ============================================================
// Uses Meta Graph API v21.0.
// Scopes: instagram_basic, instagram_content_publish
// These are Instagram-specific scopes requested through the
// Facebook OAuth dialog. They are available in Development mode
// for testers/admins and require App Review for public users.
//
// Instagram Graph API requires:
// 1. A Facebook Page
// 2. An Instagram Business/Creator account linked to that Page
// 3. The instagram_basic + instagram_content_publish permissions
//
// Publishing flow (two-step):
// 1. Create a media container (POST /{ig-user-id}/media)
// 2. Publish the container (POST /{ig-user-id}/media_publish)
// ============================================================

export class InstagramProvider implements SocialProvider {
  readonly platform = "instagram" as const;
  readonly displayName = "Instagram";
  readonly capabilities: SocialCapabilities = {
    publishPost: true,
    publishVideo: true,
    publishImage: true,
    publishText: false,
    fetchProfile: true,
    fetchFollowers: true,
    fetchComments: true,
    replyToComment: true,
    fetchAnalytics: true,
    deletePost: true,
    refreshToken: true,
    disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/instagram/callback`,
      // Instagram Graph API scopes — same 6 permissions as Facebook
      // because Instagram Graph API runs through the Meta OAuth dialog.
      // Both FB and IG use the same Meta App, so the scope string
      // must include all permissions for both platforms.
      scopes: [
        "public_profile",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
      ],
    };
  }

  isConfigured(): boolean {
    return this.getConfig() !== null;
  }

  getRequiredEnvVars(): string[] {
    return ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"];
  }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("Instagram provider not configured");
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes.join(","),
      state,
    });
    return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("Instagram provider not configured");

    // Step 1: Exchange code for short-lived user token via Facebook Graph API
    const tokenRes = await fetch(
      "https://graph.facebook.com/v21.0/oauth/access_token?" + new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
      }),
    );

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Instagram token exchange failed: ${tokenRes.status} — ${errBody}`);
    }

    const shortLived = await tokenRes.json() as { access_token: string };

    // Step 2: Exchange for long-lived token
    const longLivedRes = await fetch(
      "https://graph.facebook.com/v21.0/oauth/access_token?" + new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        fb_exchange_token: shortLived.access_token,
      }),
    );

    let longLivedToken: string;
    if (longLivedRes.ok) {
      const longLivedData = await longLivedRes.json() as { access_token: string };
      longLivedToken = longLivedData.access_token;
    } else {
      longLivedToken = shortLived.access_token;
    }

    // Step 3: Fetch Facebook Pages and find Instagram Business Account
    // This requires pages_show_list permission which is auto-granted to
    // app admins/developers/testers in Development mode.
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`,
    );

    if (!pagesRes.ok) {
      // If Pages can't be fetched, we can still save the connection
      // with the user's Facebook profile. Publishing will show an
      // appropriate error when attempted.
      const profileRes = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${longLivedToken}`,
      );
      const profile = profileRes.ok ? await profileRes.json() as { id: string; name: string } : { id: "unknown", name: "Instagram User" };

      return {
        tokens: {
          accessToken: longLivedToken,
          refreshToken: longLivedToken,
          expiresAt: "never",
          scope: config.scopes.join(","),
        },
        account: {
          externalId: profile.id,
          username: profile.name,
          displayName: profile.name,
          avatarUrl: null,
          followers: null,
          permissions: config.scopes,
        },
      };
    }

    const pagesData = await pagesRes.json() as {
      data: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string };
      }>;
    };

    // Find a page with an Instagram Business Account
    const pageWithIG = pagesData.data?.find((p) => p.instagram_business_account?.id);
    if (!pageWithIG) {
      // No IG Business account linked — still save the connection
      // but note that publishing won't be available.
      const profileRes = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${longLivedToken}`,
      );
      const profile = profileRes.ok ? await profileRes.json() as { id: string; name: string } : { id: "unknown", name: "Instagram User" };

      return {
        tokens: {
          accessToken: longLivedToken,
          refreshToken: longLivedToken,
          expiresAt: "never",
          scope: config.scopes.join(","),
        },
        account: {
          externalId: profile.id,
          username: profile.name,
          displayName: profile.name,
          avatarUrl: null,
          followers: null,
          permissions: config.scopes,
        },
      };
    }

    const igBusinessAccountId = pageWithIG.instagram_business_account!.id;
    const pageAccessToken = pageWithIG.access_token;

    // Step 4: Fetch Instagram profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessAccountId}?fields=username,followers_count,media_count,profile_picture_url&access_token=${pageAccessToken}`,
    );

    let username = pageWithIG.name;
    let followers: number | null = null;
    let avatarUrl: string | null = null;

    if (profileRes.ok) {
      const profile = await profileRes.json() as {
        username?: string;
        followers_count?: number;
        profile_picture_url?: string;
      };
      username = profile.username || username;
      followers = profile.followers_count ?? null;
      avatarUrl = profile.profile_picture_url || null;
    }

    const account: SocialAccountInfo = {
      externalId: igBusinessAccountId,
      username,
      displayName: username,
      avatarUrl,
      followers,
      permissions: config.scopes,
    };

    const tokens: OAuthTokens = {
      accessToken: pageAccessToken,
      refreshToken: longLivedToken,
      expiresAt: "never",
      scope: config.scopes.join(","),
    };

    return { tokens, account };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const config = this.getConfig();
    if (!config) throw new Error("Instagram provider not configured");

    const res = await fetch(
      "https://graph.facebook.com/v21.0/oauth/access_token?" + new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        fb_exchange_token: refreshToken,
      }),
    );
    if (!res.ok) throw new Error("Instagram token refresh failed");
    const data = await res.json() as { access_token: string };
    return {
      accessToken: data.access_token,
      refreshToken: data.access_token,
      expiresAt: "never",
      scope: config.scopes.join(","),
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`,
    );
    if (!pagesRes.ok) throw new Error("Instagram profile fetch failed");
    const pagesData = await pagesRes.json() as {
      data: Array<{
        id: string; name: string; access_token: string;
        instagram_business_account?: { id: string };
      }>;
    };

    const pageWithIG = pagesData.data?.find((p) => p.instagram_business_account?.id);
    if (!pageWithIG) throw new Error("No Instagram Business account found");

    const igId = pageWithIG.instagram_business_account!.id;
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${igId}?fields=username,followers_count,media_count,profile_picture_url&access_token=${pageWithIG.access_token}`,
    );
    if (!profileRes.ok) throw new Error("Instagram profile fetch failed");
    const profile = await profileRes.json() as {
      username: string; followers_count?: number; profile_picture_url?: string;
    };

    return {
      externalId: igId,
      username: profile.username,
      displayName: profile.username,
      avatarUrl: profile.profile_picture_url || null,
      followers: profile.followers_count ?? null,
      permissions: [],
    };
  }

  /**
   * Publish a post to Instagram.
   *
   * Instagram Graph API uses a TWO-STEP publishing flow:
   * 1. Create a media container (POST /{ig-user-id}/media)
   *    - For text-only posts, Instagram requires at least an image
   *    - If mediaUrls is provided, use the first URL as the image
   *    - If no media, we cannot publish (Instagram doesn't support
   *      text-only posts via the API)
   * 2. Publish the container (POST /{ig-user-id}/media_publish)
   *
   * The externalId stored in social_accounts is the IG Business
   * Account ID, which is used as the {ig-user-id} in the API calls.
   */
  async publishPost(params: PublishParams): Promise<PublishResult> {
    const { accessToken, message, mediaUrls } = params;

    // Instagram requires at least one media item
    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error("Instagram requires at least one media item (image or video) to publish. Text-only posts are not supported by the Instagram Graph API.");
    }

    const imageUrl = mediaUrls[0];

    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v21.0/me/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: message,
          access_token: accessToken,
        }),
      },
    );

    if (!createRes.ok) {
      const errBody = await createRes.text();
      throw new Error(`Instagram media container creation failed: ${createRes.status} — ${errBody}`);
    }

    const createData = await createRes.json() as { id: string };
    const containerId = createData.id;

    // Step 2: Publish the media container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/me/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      },
    );

    if (!publishRes.ok) {
      const errBody = await publishRes.text();
      throw new Error(`Instagram publish failed: ${publishRes.status} — ${errBody}`);
    }

    const publishData = await publishRes.json() as { id: string };

    return {
      externalPostId: publishData.id,
      publishedAt: new Date().toISOString(),
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`,
      { method: "DELETE" },
    );
  }
}
