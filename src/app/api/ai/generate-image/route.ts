import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";
import { generateImage } from "@/lib/image-provider";

// POST /api/ai/generate-image
// Body: { prompt, platform?, size? }
// Returns: { ok, base64, mimeType, provider, model, durationMs }
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

  const { prompt, platform, size } = body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json(
      { ok: false, error: "prompt is required." },
      { status: 400 },
    );
  }

  try {
    const result = await generateImage({
      prompt: String(prompt).trim(),
      platform: platform as string | undefined,
      size: size as "1024x1024" | "1792x1024" | "1024x1792" | undefined,
    });

    // Log to ai_generations (best-effort)
    if (workspace) {
      try {
        await pb.collection("ai_generations").create({
          workspace: workspace.id,
          user: user.id,
          provider: result.provider,
          model: result.model,
          input: { type: "image", prompt, platform },
          output: { mimeType: result.mimeType, base64Length: result.base64.length },
          variants_count: 1,
          status: "completed",
          duration_ms: result.durationMs,
        });
      } catch {
        // non-critical
      }
    }

    return NextResponse.json({
      ok: true,
      base64: result.base64,
      mimeType: result.mimeType,
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      { ok: false, error: `Image generation failed: ${e.message}` },
      { status: 500 },
    );
  }
}
