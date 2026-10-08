// ============================================================
// Image Provider Abstraction (server-only)
// ============================================================
// Supports:
//   - z-ai-web-dev-sdk (default — free, no API key needed)
//   - OpenAI-compatible image APIs (DALL-E, etc.)
//
// Used by /api/ai/generate-image to generate social media images.
// ============================================================

import "server-only";

const AI_IMAGE_PROVIDER = process.env.AI_IMAGE_PROVIDER || "z-ai";
const AI_PROVIDER_API_KEY = process.env.AI_PROVIDER_API_KEY || "";
const AI_PROVIDER_BASE_URL = process.env.AI_PROVIDER_BASE_URL || "";
const AI_IMAGE_MODEL = process.env.AI_IMAGE_MODEL || "dall-e-3";

export interface ImageGenerateInput {
  prompt: string;
  platform?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}

export interface ImageGenerateResult {
  base64: string;
  mimeType: string;
  provider: string;
  model: string;
  durationMs: number;
}

/**
 * Generate an image using the configured AI image provider.
 */
export async function generateImage(input: ImageGenerateInput): Promise<ImageGenerateResult> {
  const startedAt = Date.now();

  if (AI_IMAGE_PROVIDER === "openai-compatible") {
    return generateImageWithOpenAI(input, startedAt);
  }

  // Default: z-ai-web-dev-sdk
  return generateImageWithZAI(input, startedAt);
}

// ============================================================
// z-ai-web-dev-sdk image generation
// ============================================================

async function generateImageWithZAI(
  input: ImageGenerateInput,
  startedAt: number,
): Promise<ImageGenerateResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ZAI = require("z-ai-web-dev-sdk").default;
  const zai = await ZAI.create();

  const size = input.size || getOptimalSize(input.platform);

  const result = await zai.images.generations.create({
    prompt: buildImagePrompt(input),
    n: 1,
    size,
  });

  const data = result.data?.[0];
  if (!data) throw new Error("Image generation returned no data.");

  const base64 = data.base64 || data.b64_json || "";
  if (!base64) throw new Error("Image generation returned empty base64 data.");

  return {
    base64,
    mimeType: "image/png",
    provider: "z-ai",
    model: "default",
    durationMs: Date.now() - startedAt,
  };
}

// ============================================================
// OpenAI-compatible image generation
// ============================================================

async function generateImageWithOpenAI(
  input: ImageGenerateInput,
  startedAt: number,
): Promise<ImageGenerateResult> {
  if (!AI_PROVIDER_API_KEY) {
    throw new Error("AI_PROVIDER_API_KEY not configured for image generation.");
  }

  const baseUrl = AI_PROVIDER_BASE_URL || "https://api.openai.com/v1";
  const size = input.size || getOptimalSize(input.platform);

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_PROVIDER_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_IMAGE_MODEL,
      prompt: buildImagePrompt(input),
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Image generation failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const base64 = data.data?.[0]?.b64_json;

  if (!base64) throw new Error("Image generation returned no image data.");

  return {
    base64,
    mimeType: "image/png",
    provider: "openai-compatible",
    model: AI_IMAGE_MODEL,
    durationMs: Date.now() - startedAt,
  };
}

// ============================================================
// Helpers
// ============================================================

function getOptimalSize(platform?: string): "1024x1024" | "1792x1024" | "1024x1792" {
  // Instagram: square or portrait
  // LinkedIn: landscape or square
  // X: landscape or square
  // Default: square
  switch (platform) {
    case "instagram":
    case "tiktok":
    case "pinterest":
      return "1024x1024"; // Square for IG/TikTok/Pinterest
    case "linkedin":
    case "x":
    case "facebook":
      return "1792x1024"; // Landscape for professional platforms
    default:
      return "1024x1024";
  }
}

function buildImagePrompt(input: ImageGenerateInput): string {
  const platformHint = input.platform
    ? `Optimized for ${input.platform} — `
    : "";

  return `${platformHint}Professional social media graphic. ${input.prompt}. Clean, modern, high-quality, visually appealing, suitable for social media posting.`;
}
