import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";
import { generateContent } from "@/lib/ai-provider";

// POST /api/ai/generate
// Body: { platform, contentType, topic, tone, language, audience?, length?, cta?, hashtags?, variants? }
// Returns: { ok, variants: [...], generationId?, provider, model, durationMs }
//
// This route is resilient: if the `ai_generations` or `usage` collections
// don't exist yet (schema not migrated), the AI generation still succeeds
// — we just skip the audit logging. The user always gets their variants.
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    platform,
    contentType,
    topic,
    tone,
    language,
    audience,
    length,
    cta,
    hashtags,
    variants,
  } = body;

  if (!platform || !contentType || !topic || !tone || !language) {
    return NextResponse.json(
      { ok: false, error: "platform, contentType, topic, tone, and language are required." },
      { status: 400 },
    );
  }

  // Create a pending ai_generation record (best-effort — skip if collection missing)
  let generationId: string | null = null;
  if (workspace) {
    try {
      const generation = await pb.collection("ai_generations").create({
        workspace: workspace.id,
        user: user.id,
        provider: "default",
        model: "auto",
        input: { platform, contentType, topic, tone, language, audience, length, cta, hashtags },
        output: null,
        variants_count: 0,
        status: "processing",
      });
      generationId = generation.id;
    } catch {
      // ai_generations collection may not exist yet — non-fatal, generation still works
    }
  }

  // Generate via the configured AI provider
  try {
    const result = await generateContent({
      platform: String(platform),
      contentType: String(contentType),
      topic: String(topic),
      tone: String(tone),
      language: String(language),
      audience: audience as string | undefined,
      length: length as string | undefined,
      cta: cta as string | undefined,
      hashtags: hashtags as string | undefined,
      variants: (variants as number) || 3,
    });

    // Update the generation record (best-effort)
    if (generationId) {
      try {
        await pb.collection("ai_generations").update(generationId, {
          provider: result.provider,
          model: result.model,
          output: { variants: result.variants },
          variants_count: result.variants.length,
          tokens_used: result.tokensUsed || 0,
          duration_ms: result.durationMs,
          status: "completed",
        });
      } catch {
        // ignore — audit log update is non-critical
      }
    }

    // Bump usage counter (best-effort)
    if (workspace) {
      try {
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existing = await pb.collection("usage").getList(1, 1, {
          filter: `workspace = "${workspace.id}" && period = "${period}"`,
        });
        if (existing.items.length > 0) {
          const u = existing.items[0];
          await pb.collection("usage").update(u.id, {
            ai_generations: (u.ai_generations as number) || 0 + 1,
          });
        }
      } catch {
        // usage update is non-critical
      }
    }

    return NextResponse.json({
      ok: true,
      generationId,
      variants: result.variants,
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const e = err as Error;
    // Update generation record with the error (best-effort)
    if (generationId) {
      try {
        await pb.collection("ai_generations").update(generationId, {
          status: "failed",
          error: e.message,
        });
      } catch {
        // ignore
      }
    }
    return NextResponse.json(
      { ok: false, error: `AI generation failed: ${e.message}`, generationId },
      { status: 500 },
    );
  }
}
