import type { Platform } from "./types";

interface PlatformMeta {
  name: string;
  color: string; // hex
  glyph: string; // single letter or short label for monochrome badge
}

export const platformMeta: Record<Platform, PlatformMeta> = {
  tiktok: { name: "TikTok", color: "#ffffff", glyph: "TK" },
  instagram: { name: "Instagram", color: "#ffffff", glyph: "IG" },
  facebook: { name: "Facebook", color: "#ffffff", glyph: "FB" },
  youtube: { name: "YouTube", color: "#ffffff", glyph: "YT" },
  x: { name: "X", color: "#ffffff", glyph: "X" },
  linkedin: { name: "LinkedIn", color: "#ffffff", glyph: "in" },
  threads: { name: "Threads", color: "#ffffff", glyph: "@@" },
  pinterest: { name: "Pinterest", color: "#ffffff", glyph: "P" },
};

export const platformList: Platform[] = [
  "tiktok",
  "instagram",
  "youtube",
  "x",
  "linkedin",
  "facebook",
  "threads",
  "pinterest",
];
