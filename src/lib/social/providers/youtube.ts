import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig } from "../types";

export class YouTubeProvider implements SocialProvider {
  readonly platform = "youtube" as const;
  readonly displayName = "YouTube";
  readonly capabilities: SocialCapabilities = {
    publishPost: false, publishVideo: true, publishImage: false, publishText: false,
    fetchProfile: true, fetchFollowers: true, fetchComments: true, replyToComment: true,
    fetchAnalytics: true, deletePost: true, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/youtube/callback`,
      scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"],
    };
  }

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("YouTube provider not configured");
    const params = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.redirectUri,
      response_type: "code", scope: config.scopes.join(" "), state,
      access_type: "offline", prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/auth?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("YouTube provider not configured");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId, client_secret: config.clientSecret,
        grant_type: "authorization_code", redirect_uri: config.redirectUri, code,
      }),
    });
    if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    // Fetch channel info
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!channelRes.ok) throw new Error("YouTube channel fetch failed");
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    const account: SocialAccountInfo = {
      externalId: channel?.id || tokenData.access_token.slice(0, 20),
      username: channel?.snippet?.customUrl || channel?.snippet?.title || "YouTube Channel",
      displayName: channel?.snippet?.title || "YouTube Channel",
      avatarUrl: channel?.snippet?.thumbnails?.default?.url || null,
      followers: channel?.statistics?.subscriberCount ? parseInt(channel.statistics.subscriberCount) : null,
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
    if (!config) throw new Error("YouTube provider not configured");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId, client_secret: config.clientSecret,
        grant_type: "refresh_token", refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error("Google token refresh failed");
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("YouTube profile fetch failed");
    const data = await res.json();
    const channel = data.items?.[0];
    return {
      externalId: channel?.id || "", username: channel?.snippet?.customUrl || "",
      displayName: channel?.snippet?.title || "", avatarUrl: channel?.snippet?.thumbnails?.default?.url || null,
      followers: channel?.statistics?.subscriberCount ? parseInt(channel.statistics.subscriberCount) : null,
      permissions: [],
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" });
  }
}
