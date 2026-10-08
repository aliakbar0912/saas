// ============================================================
// AI provider abstraction (server-only)
// ============================================================
// Supports:
//   - OpenAI-compatible APIs (OpenAI, Together, OpenRouter, etc.)
//   - Anthropic
//   - z-ai-web-dev-sdk (default if no provider configured)
//
// Used by /api/ai/generate to generate content variants.
// ============================================================

import "server-only";

const AI_PROVIDER_API_KEY = process.env.AI_PROVIDER_API_KEY || "";
const AI_PROVIDER_BASE_URL = process.env.AI_PROVIDER_BASE_URL || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "default";

export interface GenerateInput {
  platform: string;
  contentType: string;
  topic: string;
  tone: string;
  language: string;
  audience?: string;
  length?: string;
  cta?: string;
  hashtags?: string;
  variants?: number;
}

export interface GeneratedVariant {
  label: string;
  tone: string;
  content: string;
  hashtags: string[];
  predictedEngagement: string;
  confidence: number;
}

export interface GenerateResult {
  variants: GeneratedVariant[];
  provider: string;
  model: string;
  tokensUsed?: number;
  durationMs: number;
}

/**
 * Generate content variants using the configured AI provider.
 */
export async function generateContent(input: GenerateInput): Promise<GenerateResult> {
  const startedAt = Date.now();

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "openai-compatible") {
    if (!AI_PROVIDER_API_KEY) {
      throw new Error("AI_PROVIDER_API_KEY not configured.");
    }
    return generateWithOpenAI(input, startedAt);
  }

  // Default: use the z-ai-web-dev-sdk
  return generateWithDefault(input, startedAt);
}

// ============================================================
// Default provider: z-ai-web-dev-sdk
// ============================================================

async function generateWithDefault(
  input: GenerateInput,
  startedAt: number,
): Promise<GenerateResult> {
  // Dynamically import so the SDK only loads server-side
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ZAI = require("z-ai-web-dev-sdk").default;

  const zai = await ZAI.create();
  const variantsRequested = input.variants ?? 3;

  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input, variantsRequested);

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const text =
    completion.choices?.[0]?.message?.content ??
    completion.choices?.[0]?.delta?.content ??
    "";

  const variants = parseVariants(text, input, variantsRequested);

  return {
    variants,
    provider: "z-ai-default",
    model: "glm-4",
    tokensUsed: completion.usage?.total_tokens,
    durationMs: Date.now() - startedAt,
  };
}

// ============================================================
// OpenAI-compatible provider
// ============================================================

async function generateWithOpenAI(
  input: GenerateInput,
  startedAt: number,
): Promise<GenerateResult> {
  const baseUrl = AI_PROVIDER_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_PROVIDER_MODEL || "gpt-4o-mini";
  const variantsRequested = input.variants ?? 3;

  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input, variantsRequested);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_PROVIDER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI provider error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  const variants = parseVariants(text, input, variantsRequested);

  return {
    variants,
    provider: "openai-compatible",
    model: data.model || model,
    tokensUsed: data.usage?.total_tokens,
    durationMs: Date.now() - startedAt,
  };
}

// ============================================================
// Prompt builders
// ============================================================

function buildSystemPrompt(input: GenerateInput): string {
  return `You are a senior social media content strategist. Your job is to generate ${input.variants ?? 3} distinct variants of ${input.contentType} content for ${input.platform}, optimized for the user's audience.

Audience: ${input.audience || "general"}
Language: ${input.language}
Tone family: ${input.tone}

Rules:
- Each variant MUST use a distinct tone strategy (e.g. "Professional", "Casual", "High engagement").
- Lead with a hook in the first 1-2 sentences.
- End with the requested call-to-action when provided.
- Hashtags must be relevant to the topic, not generic.
- Stay within the platform's typical length conventions.
- Never use emojis unless the platform convention demands them.

OUTPUT FORMAT (strict — parseable JSON):
Return a JSON array of objects with these exact fields:
[
  {
    "label": "Variant A",
    "tone": "Professional",
    "content": "the actual caption/post text",
    "hashtags": ["#ai", "#productivity"],
    "predictedEngagement": "High",
    "confidence": 0.9
  }
]

Return ONLY the JSON array. No prose, no markdown fences.`;
}

function buildUserPrompt(input: GenerateInput, variants: number): string {
  return `Topic: ${input.topic}
Platform: ${input.platform}
Content type: ${input.contentType}
Tone family: ${input.tone}
Language: ${input.language}
${input.audience ? `Audience: ${input.audience}` : ""}
${input.length ? `Length: ${input.length}` : ""}
${input.cta ? `Call-to-action: ${input.cta}` : ""}
${input.hashtags ? `Suggested hashtags (can refine): ${input.hashtags}` : ""}

Generate ${variants} variants. Return JSON array only.`;
}

// ============================================================
// Response parser — robust against model formatting drift
// ============================================================

function parseVariants(
  text: string,
  input: GenerateInput,
  expected: number,
): GeneratedVariant[] {
  // Strip code fences if present
  const cleaned = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();

  // Attempt 1: direct JSON.parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return normalizeVariants(parsed, input, expected);
    }
  } catch {
    // fallthrough
  }

  // Attempt 2: extract the JSON array substring (model may have wrapped it in prose)
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeVariants(parsed, input, expected);
      }
    } catch {
      // fallthrough
    }
  }

  // Attempt 3: try to fix common LLM JSON errors (unquoted hashtags, trailing commas)
  if (arrayMatch) {
    const fixed = arrayMatch[0]
      // Fix unquoted hashtag values like #DeveloperTools" → "#DeveloperTools"
      .replace(/(,|\[)\s*#([a-zA-Z0-9_]+)/g, '$1"#$2"')
      // Remove trailing commas before ] or }
      .replace(/,(\s*[\]}])/g, "$1");
    try {
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeVariants(parsed, input, expected);
      }
    } catch {
      // fallthrough
    }
  }

  // Attempt 4: parse individual variant objects via regex
  const objectMatches = cleaned.match(/\{[^{}]*"content"[^{}]*\}/g);
  if (objectMatches && objectMatches.length > 0) {
    const variants: GeneratedVariant[] = [];
    for (const objStr of objectMatches) {
      const label = objStr.match(/"label"\s*:\s*"([^"]+)"/);
      const tone = objStr.match(/"tone"\s*:\s*"([^"]+)"/);
      const content = objStr.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const predictedEngagement = objStr.match(/"predictedEngagement"\s*:\s*"([^"]+)"/);
      const confidence = objStr.match(/"confidence"\s*:\s*([0-9.]+)/);
      const hashtagsMatch = objStr.match(/"hashtags"\s*:\s*\[([^\]]*)\]/);
      const hashtags = hashtagsMatch
        ? hashtagsMatch[1].match(/#?[a-zA-Z0-9_]+/g)?.map((h) => (h.startsWith("#") ? h : `#${h}`)) ?? []
        : [];
      if (content) {
        variants.push({
          label: label?.[1] || `Variant ${String.fromCharCode(65 + variants.length)}`,
          tone: tone?.[1] || input.tone,
          content: content[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"),
          hashtags,
          predictedEngagement: predictedEngagement?.[1] || "Medium",
          confidence: confidence ? Number(confidence[1]) : 0.7,
        });
      }
    }
    if (variants.length > 0) {
      return variants.slice(0, expected);
    }
  }

  // Fallback: treat the whole text as one variant
  return [
    {
      label: "Variant A",
      tone: input.tone,
      content: cleaned,
      hashtags: [],
      predictedEngagement: "Medium",
      confidence: 0.5,
    },
  ];
}

function normalizeVariants(
  parsed: unknown[],
  input: GenerateInput,
  expected: number,
): GeneratedVariant[] {
  return parsed.slice(0, expected).map((v, i) => {
    const obj = v as Record<string, unknown>;
    return {
      label: (obj.label as string) || `Variant ${String.fromCharCode(65 + i)}`,
      tone: (obj.tone as string) || input.tone,
      content: (obj.content as string) || "",
      hashtags: Array.isArray(obj.hashtags)
        ? (obj.hashtags as unknown[]).map((h) => String(h))
        : [],
      predictedEngagement: (obj.predictedEngagement as string) || "Medium",
      confidence: typeof obj.confidence === "number" ? obj.confidence : 0.8,
    };
  });
}
