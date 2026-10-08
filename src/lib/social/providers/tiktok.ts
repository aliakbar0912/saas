import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig } from "../types";

export class TikTokProvider implements SocialProvider {
  readonly platform = "tiktok" as const;
  readonly displayName = "TikTok";
  readonly capabilities: SocialCapabilities = {
    publishPost: true, publishVideo: true, publishImage: false, publishText: false,
    fetchProfile: true, fetchFollowers: true, fetchComments: true, replyToComment: false,
    fetchAnalytics: true, deletePost: true, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/tiktok/callback`,
      scopes: ["user.info.basic", "video.publish", "video.list", "user.info.profile"],
    };
  }

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["TIKTOK_CLIENT_ID", "TIKTOK_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("TikTok provider not configured");
    const params = new URLSearchParams({
      client_key: config.clientId, redirect_uri: config.redirectUri,
      response_type: "code", scope: config.scopes.join(","), state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("TikTok provider not configured");

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: config.clientId, client_secret: config.clientSecret,
        grant_type: "authorization_code", redirect_uri: config.redirectUri, code,
      }),
    });
    if (!tokenRes.ok) throw new Error(`TikTok token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new Error("TikTok user info fetch failed");
    const userData = await userRes.json();
    const user = userData.data?.user;

    const account: SocialAccountInfo = {
      externalId: user?.open_id || tokenData.open_id,
      username: user?.display_name || user?.username || "tiktok_user",
      displayName: user?.display_name || user?.username || "TikTok User",
      avatarUrl: user?.avatar_url || null,
      followers: null,
      permissions: config.scopes,
    };

    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scope: tokenData.scope,
    };

    return { tokens, account };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const config = this.getConfig();
    if (!config) throw new Error("TikTok provider not configured");

    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: config.clientId, client_secret: config.clientSecret,
        grant_type: "refresh_token", refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error("TikTok token refresh failed");
    const data = await res.json();
    return {
      accessToken: data.access_token, refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch("https://open.tiktokapis.com/v2/user/info/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("TikTok profile fetch failed");
    const data = await res.json();
    const user = data.data?.user;
    return {
      externalId: user?.open_id || "", username: user?.username || "",
      displayName: user?.display_name || user?.username || "", avatarUrl: user?.avatar_url || null,
      followers: null, permissions: [],
    };
  }
}
