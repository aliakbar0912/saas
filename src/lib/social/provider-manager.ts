// ============================================================
// Provider Manager — central registry for all social providers
// ============================================================
import type { SocialProvider, Platform } from "./types";
import { InstagramProvider } from "./providers/instagram";
import { FacebookProvider } from "./providers/facebook";
import { TikTokProvider } from "./providers/tiktok";
import { YouTubeProvider } from "./providers/youtube";
import { XProvider } from "./providers/x";
import { LinkedInProvider } from "./providers/linkedin";
import { ThreadsProvider } from "./providers/threads";
import { PinterestProvider } from "./providers/pinterest";

const providers = new Map<Platform, SocialProvider>([
  ["instagram", new InstagramProvider()],
  ["facebook", new FacebookProvider()],
  ["tiktok", new TikTokProvider()],
  ["youtube", new YouTubeProvider()],
  ["x", new XProvider()],
  ["linkedin", new LinkedInProvider()],
  ["threads", new ThreadsProvider()],
  ["pinterest", new PinterestProvider()],
]);

export function getProvider(platform: string): SocialProvider | null {
  return providers.get(platform as Platform) ?? null;
}

export function getProviderOrThrow(platform: string): SocialProvider {
  const provider = providers.get(platform as Platform);
  if (!provider) throw new Error(`Unknown platform: ${platform}`);
  return provider;
}

export function getAllProviders(): SocialProvider[] {
  return Array.from(providers.values());
}

export function getAllProviderStatuses(): Array<{
  platform: Platform;
  displayName: string;
  configured: boolean;
  requiredEnvVars: string[];
  capabilities: SocialProvider["capabilities"];
}> {
  return getAllProviders().map((p) => ({
    platform: p.platform,
    displayName: p.displayName,
    configured: p.isConfigured(),
    requiredEnvVars: p.getRequiredEnvVars(),
    capabilities: p.capabilities,
  }));
}

// Re-export types
export type { SocialProvider, Platform } from "./types";
