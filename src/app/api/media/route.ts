import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, userPbClient } from "@/lib/server-auth";
import { ensureDefaultWorkspace } from "@/lib/workspace";

// GET /api/media?type=image
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json({ ok: true, items: [], schemaSetupRequired: true });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const q = url.searchParams.get("q");

  const filters = [`workspace = "${workspace.id}"`];
  if (type && type !== "all") filters.push(`type = "${type}"`);
  if (q) filters.push(`name ~ "${q.replace(/"/g, "")}"`);

  try {
    const items = await pb.collection("media").getFullList({
      filter: filters.join(" && "),
      sort: "-created",
    });
    return NextResponse.json({
      ok: true,
      items: items.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        size: m.size,
        tags: m.tags || [],
        url: m.file ? `${pb.baseUrl}/api/files/media/${m.id}/${m.file}` : null,
        created: m.created,
      })),
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST /api/media — multipart upload
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req as unknown as Request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const pb = userPbClient(user.token);
  const workspace = await ensureDefaultWorkspace(pb, user.id, user.email);

  if (!workspace) {
    return NextResponse.json({ ok: true, items: [], schemaSetupRequired: true });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;
  const type = formData.get("type") as string | null;
  const tags = formData.get("tags") as string | null;

  if (!file) {
    return NextResponse.json({ ok: false, error: "file is required." }, { status: 400 });
  }

  // Determine type from mime
  let resolvedType = type;
  if (!resolvedType) {
    if (file.type.startsWith("image/")) resolvedType = "image";
    else if (file.type.startsWith("video/")) resolvedType = "video";
    else if (file.type.startsWith("audio/")) resolvedType = "audio";
    else resolvedType = "image";
  }

  try {
    // PocketBase file upload via FormData
    const uploadForm = new FormData();
    uploadForm.append("workspace", workspace.id);
    uploadForm.append("uploaded_by", user.id);
    uploadForm.append("name", name || file.name);
    uploadForm.append("type", resolvedType);
    uploadForm.append("size", String(file.size));
    uploadForm.append("tags", tags || "[]");
    uploadForm.append("file", file, file.name);

    const created = await pb.collection("media").create(uploadForm);

    return NextResponse.json({
      ok: true,
      media: {
        id: created.id,
        name: created.name,
        type: created.type,
        size: created.size,
        url: created.file
          ? `${pb.baseUrl}/api/files/media/${created.id}/${created.file}`
          : null,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
