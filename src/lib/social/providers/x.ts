import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig } from "../types";

export class XProvider implements SocialProvider {
  readonly platform = "x" as const;
  readonly displayName = "X (Twitter)";
  readonly capabilities: SocialCapabilities = {
    publishPost: true, publishVideo: false, publishImage: true, publishText: true,
    fetchProfile: true, fetchFollowers: true, fetchComments: true, replyToComment: true,
    fetchAnalytics: false, deletePost: true, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/x/callback`,
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    };
  }

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["X_CLIENT_ID", "X_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("X provider not configured");
    const params = new URLSearchParams({
      response_type: "code", client_id: config.clientId,
      redirect_uri: config.redirectUri, scope: config.scopes.join(" "),
      state, code_challenge: "challenge", code_challenge_method: "plain",
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("X provider not configured");

    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code, grant_type: "authorization_code",
        redirect_uri: config.redirectUri, code_verifier: "challenge",
      }),
    });
    if (!tokenRes.ok) throw new Error(`X token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new Error("X user info fetch failed");
    const userData = await userRes.json();
    const user = userData.data;

    const account: SocialAccountInfo = {
      externalId: user.id,
      username: user.username,
      displayName: user.name,
      avatarUrl: user.profile_image_url?.replace("_normal", "") || null,
      followers: user.public_metrics?.followers_count ?? null,
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
    if (!config) throw new Error("X provider not configured");
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token", refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error("X token refresh failed");
    const data = await res.json();
    return {
      accessToken: data.access_token, refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("X profile fetch failed");
    const data = await res.json();
    const user = data.data;
    return {
      externalId: user.id, username: user.username, displayName: user.name,
      avatarUrl: user.profile_image_url || null, followers: user.public_metrics?.followers_count ?? null,
      permissions: [],
    };
  }
}
