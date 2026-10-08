import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig } from "../types";

export class PinterestProvider implements SocialProvider {
  readonly platform = "pinterest" as const;
  readonly displayName = "Pinterest";
  readonly capabilities: SocialCapabilities = {
    publishPost: true, publishVideo: false, publishImage: true, publishText: false,
    fetchProfile: true, fetchFollowers: false, fetchComments: false, replyToComment: false,
    fetchAnalytics: true, deletePost: true, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/pinterest/callback`,
      scopes: ["boards:read", "pins:read", "pins:write"],
    };
  }

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("Pinterest provider not configured");
    const params = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.redirectUri,
      response_type: "code", scope: config.scopes.join(","), state,
    });
    return `https://www.pinterest.com/oauth/?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("Pinterest provider not configured");

    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: config.redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error(`Pinterest token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    // Fetch account info
    const userRes = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    let profile: any = { username: "pinterest_user" };
    if (userRes.ok) profile = await userRes.json();

    const account: SocialAccountInfo = {
      externalId: String(profile.id || profile.username),
      username: profile.username,
      displayName: profile.business_name || profile.username,
      avatarUrl: profile.profile_image || null,
      followers: null,
      permissions: config.scopes,
    };

    const tokens: OAuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scope: tokenData.scope || config.scopes.join(","),
    };

    return { tokens, account };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const config = this.getConfig();
    if (!config) throw new Error("Pinterest provider not configured");
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

    const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token", refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error("Pinterest token refresh failed");
    const data = await res.json();
    return {
      accessToken: data.access_token, refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Pinterest profile fetch failed");
    const data = await res.json();
    return {
      externalId: String(data.id || ""), username: data.username || "",
      displayName: data.business_name || data.username || "", avatarUrl: data.profile_image || null,
      followers: null, permissions: [],
    };
  }
}
