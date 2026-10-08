import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig } from "../types";

export class ThreadsProvider implements SocialProvider {
  readonly platform = "threads" as const;
  readonly displayName = "Threads";
  readonly capabilities: SocialCapabilities = {
    publishPost: true, publishVideo: false, publishImage: true, publishText: true,
    fetchProfile: true, fetchFollowers: false, fetchComments: false, replyToComment: false,
    fetchAnalytics: false, deletePost: false, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.THREADS_CLIENT_ID;
    const clientSecret = process.env.THREADS_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/threads/callback`,
      scopes: ["threads_basic", "threads_content_publish"],
    };
  }

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["THREADS_CLIENT_ID", "THREADS_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("Threads provider not configured");
    const params = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.redirectUri,
      response_type: "code", scope: config.scopes.join(","), state,
    });
    return `https://threads.net/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("Threads provider not configured");

    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId, client_secret: config.clientSecret,
        grant_type: "authorization_code", redirect_uri: config.redirectUri, code,
      }),
    });
    if (!tokenRes.ok) throw new Error(`Threads token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    // Exchange for long-lived token
    const longRes = await fetch(`https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${config.clientSecret}&access_token=${tokenData.access_token}`);
    const longLived = longRes.ok ? await longRes.json() : tokenData;

    // Fetch profile
    const profileRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${longLived.access_token}`);
    let profile: any = { id: "", username: "threads_user" };
    if (profileRes.ok) profile = await profileRes.json();

    const account: SocialAccountInfo = {
      externalId: profile.id,
      username: profile.username,
      displayName: profile.username,
      avatarUrl: profile.threads_profile_picture_url || null,
      followers: null,
      permissions: config.scopes,
    };

    const tokens: OAuthTokens = {
      accessToken: longLived.access_token,
      expiresAt: new Date(Date.now() + (longLived.expires_in || 5184000) * 1000).toISOString(),
      scope: config.scopes.join(","),
    };

    return { tokens, account };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${refreshToken}`);
    if (!res.ok) throw new Error("Threads token refresh failed");
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`);
    if (!res.ok) throw new Error("Threads profile fetch failed");
    const data = await res.json();
    return {
      externalId: data.id, username: data.username, displayName: data.username,
      avatarUrl: data.threads_profile_picture_url || null, followers: null, permissions: [],
    };
  }
}
