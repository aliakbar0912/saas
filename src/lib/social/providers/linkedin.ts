import type { SocialProvider, SocialAccountInfo, OAuthTokens, CodeExchangeResult, SocialCapabilities, ProviderConfig } from "../types";

export class LinkedInProvider implements SocialProvider {
  readonly platform = "linkedin" as const;
  readonly displayName = "LinkedIn";
  readonly capabilities: SocialCapabilities = {
    publishPost: true, publishVideo: false, publishImage: true, publishText: true,
    fetchProfile: true, fetchFollowers: true, fetchComments: false, replyToComment: false,
    fetchAnalytics: true, deletePost: true, refreshToken: true, disconnect: true,
  };

  private getConfig(): ProviderConfig | null {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      clientId, clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/social/linkedin/callback`,
      scopes: ["w_member_social", "r_member_social", "r_organization_social", "rw_organization_admin", "r_basicprofile", "r_organization_followers"],
    };
  }

  isConfigured(): boolean { return this.getConfig() !== null; }
  getRequiredEnvVars(): string[] { return ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"]; }

  createAuthorizationUrl(state: string): string {
    const config = this.getConfig();
    if (!config) throw new Error("LinkedIn provider not configured");
    const params = new URLSearchParams({
      response_type: "code", client_id: config.clientId,
      redirect_uri: config.redirectUri, scope: config.scopes.join(" "), state,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }

  async exchangeCode(code: string): Promise<CodeExchangeResult> {
    const config = this.getConfig();
    if (!config) throw new Error("LinkedIn provider not configured");

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId, client_secret: config.clientSecret,
      }),
    });
    if (!tokenRes.ok) throw new Error(`LinkedIn token exchange failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    // Fetch profile
    const profileRes = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    let profile: any = { id: "", localizedFirstName: "", localizedLastName: "" };
    if (profileRes.ok) profile = await profileRes.json();

    const displayName = `${profile.localizedFirstName || ""} ${profile.localizedLastName || ""}`.trim() || "LinkedIn User";
    const avatarUrl = profile.profilePicture?.["displayImage~"]?.elements?.slice(-1)?.[0]?.identifiers?.[0]?.identifier || null;

    const account: SocialAccountInfo = {
      externalId: profile.id,
      username: displayName,
      displayName,
      avatarUrl,
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
    if (!config) throw new Error("LinkedIn provider not configured");

    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token", refresh_token: refreshToken,
        client_id: config.clientId, client_secret: config.clientSecret,
      }),
    });
    if (!res.ok) throw new Error("LinkedIn token refresh failed");
    const data = await res.json();
    return {
      accessToken: data.access_token, refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
    };
  }

  async fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo> {
    const res = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("LinkedIn profile fetch failed");
    const profile = await res.json();
    return {
      externalId: profile.id,
      username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      displayName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      avatarUrl: null, followers: null, permissions: [],
    };
  }
}
