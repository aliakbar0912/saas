import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig, PublishParams, PublishResult } from "../types";

// ============================================================
// Facebook Provider — Facebook Login + Pages API
// ============================================================
// Uses Meta Graph API v21.0.
// Scopes: public_profile (auto), pages_show_list, pages_read_engagement
// These are the correct permissions for reading Pages and publishing
// content to Pages. pages_show_list and pages_read_engagement are
// available in Development mode for testers/admins, and require
// App Review for public users.
// ============================================================

export class FacebookProvider implements SocialProvider {
  readonly platform = "facebook" as const;
  readonly displayName = "Facebook";
  readonly capabilities: SocialCapabilities = {
    publishPost: true, publishVideo: true, publishImage: true, publishText: true,
    fetchProfile: true, fetchFollowers: true, fetchComments: true, replyToComment: true,
    fetchAnalytics: true, deletePost: true, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/facebook/callback`,
      // Facebook Login scopes — all 6 permissions required for full
      // Page management + Instagram publishing via the same Meta App.
      // Both Facebook and Instagram use the same OAuth dialog and
      // the same scope string. The scopes are:
      // - public_profile: auto-granted, reads user name + ID
      // - pages_show_list: shows the user's Pages
      // - pages_read_engagement: read Page content + insights
      // - pages_manage_posts: publish to Pages
      // - instagram_basic: read IG profile (via linked Page)
      // - instagram_content_publish: publish to IG (via linked Page)
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

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("Facebook provider not configured");
    const params = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.redirectUri,
      response_type: "code", scope: config.scopes.join(","), state,
    });
    return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("Facebook provider not configured");

    // Step 1: Exchange code for short-lived user token
    const tokenRes = await fetch("https://graph.facebook.com/v21.0/oauth/access_token?" + new URLSearchParams({
      client_id: config.clientId, client_secret: config.clientSecret,
      redirect_uri: config.redirectUri, code,
    }));
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Facebook token exchange failed: ${tokenRes.status} — ${errBody}`);
    }
    const tokenData = await tokenRes.json() as { access_token: string };

    // Step 2: Exchange for long-lived token
    const longLivedRes = await fetch("https://graph.facebook.com/v21.0/oauth/access_token?" + new URLSearchParams({
      grant_type: "fb_exchange_token", client_id: config.clientId,
      client_secret: config.clientSecret, fb_exchange_token: tokenData.access_token,
    }));
    const longLived = longLivedRes.ok ? await longLivedRes.json() as { access_token: string } : tokenData;

    // Step 3: Fetch the user's profile
    const profileRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${longLived.access_token}`);
    if (!profileRes.ok) throw new Error("Facebook profile fetch failed");
    const profile = await profileRes.json() as { id: string; name: string; picture?: { data?: { url?: string } } };

    // Step 4: Fetch the user's Pages
    // This requires pages_show_list permission. If the permission isn't
    // granted (App Review pending), the API returns an empty data array
    // or an error. We handle both gracefully.
    let pageAccessToken = longLived.access_token;
    let pageName = profile.name;
    let pageId = profile.id;
    let hasPageAccess = false;

    try {
      const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${longLived.access_token}`);
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json() as { data?: Array<{ id: string; name: string; access_token: string }> };
        if (pagesData.data && pagesData.data.length > 0) {
          const page = pagesData.data[0];
          pageAccessToken = page.access_token;
          pageName = page.name;
          pageId = page.id;
          hasPageAccess = true;
        }
      }
    } catch {
      // Pages API not available — use user profile instead
    }

    const account: SocialAccountInfo = {
      externalId: pageId,
      username: pageName,
      displayName: profile.name || pageName,
      avatarUrl: profile.picture?.data?.url || null,
      followers: null,
      permissions: hasPageAccess ? config.scopes : ["public_profile"],
    };

    const tokens: OAuthTokens = {
      accessToken: pageAccessToken,
      refreshToken: longLived.access_token,
      expiresAt: "never",
      scope: hasPageAccess ? config.scopes.join(",") : "public_profile",
    };

    return { tokens, account };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const config = this.getConfig();
    if (!config) throw new Error("Facebook provider not configured");

    const res = await fetch("https://graph.facebook.com/v21.0/oauth/access_token?" + new URLSearchParams({
      grant_type: "fb_exchange_token", client_id: config.clientId,
      client_secret: config.clientSecret, fb_exchange_token: refreshToken,
    }));
    if (!res.ok) throw new Error("Facebook token refresh failed");
    const data = await res.json() as { access_token: string };
    return { accessToken: data.access_token, refreshToken: data.access_token, expiresAt: "never" };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,picture,followers_count&access_token=${accessToken}`);
    if (!res.ok) throw new Error("Facebook profile fetch failed");
    const data = await res.json();
    return {
      externalId: data.id, username: data.name, displayName: data.name,
      avatarUrl: data.picture?.data?.url || null, followers: data.followers_count ?? null, permissions: [],
    };
  }

  /**
   * Publish a post to a Facebook Page.
   * Uses the Page access token (stored in oauth_connections).
   * The Page ID is the externalId stored in social_accounts.
   */
  async publishPost(params: PublishParams): Promise<PublishResult> {
    const { accessToken, message } = params;

    // POST to /{page-id}/feed with message
    const res = await fetch(`https://graph.facebook.com/v21.0/me/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Facebook publish failed: ${res.status} — ${errBody}`);
    }

    const data = await res.json() as { id: string };
    return {
      externalPostId: data.id,
      publishedAt: new Date().toISOString(),
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`, { method: "DELETE" });
  }
}
