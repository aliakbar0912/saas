// ============================================================
// Social Provider Abstraction Interface
// ============================================================
// Every provider implements this interface. The rest of the app
// interacts only with the ProviderManager, never directly with
// individual providers.
// ============================================================

export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "threads"
  | "pinterest";

export interface SocialCapabilities {
  publishPost: boolean;
  publishVideo: boolean;
  publishImage: boolean;
  publishText: boolean;
  fetchProfile: boolean;
  fetchFollowers: boolean;
  fetchComments: boolean;
  replyToComment: boolean;
  fetchAnalytics: boolean;
  deletePost: boolean;
  refreshToken: boolean;
  disconnect: boolean;
}

export interface SocialAccountInfo {
  externalId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number | null;
  permissions: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string; // ISO timestamp
  scope?: string;
}

export interface AuthorizationParams {
  url: string;
  state: string;
}

export interface CodeExchangeResult {
  tokens: OAuthTokens;
  account: SocialAccountInfo;
}

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface SocialProvider {
  readonly platform: Platform;
  readonly displayName: string;
  readonly capabilities: SocialCapabilities;

  /** Check if this provider is configured (has env credentials). */
  isConfigured(): boolean;

  /** Get required environment variable names for this provider. */
  getRequiredEnvVars(): string[];

  /** Generate the OAuth authorization URL + state. */
  createAuthorizationUrl(state: string): string;

  /** Exchange authorization code for tokens + fetch account info. */
  exchangeCode(code: string): Promise<CodeExchangeResult>;

  /** Refresh access token if supported. */
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;

  /** Fetch updated account info using existing tokens. */
  fetchAccountInfo(accessToken: string): Promise<SocialAccountInfo>;

  /**
   * Publish a post to the platform. Returns the external post ID
   * on success. Throws on failure.
   */
  publishPost?(params: PublishParams): Promise<PublishResult>;

  /** Revoke access / deauthorize (where supported). */
  revokeAccess?(accessToken: string): Promise<void>;
}

export interface PublishParams {
  accessToken: string;
  message: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}

export interface PublishResult {
  externalPostId: string;
  publishedAt: string;
}
