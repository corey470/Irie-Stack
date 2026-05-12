import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { uploadPostImage } from "@/lib/media-storage";
import { createAdminClient } from "@/lib/supabase/admin";

type PieceRow = {
  id: string;
  user_id: string;
  title: string;
  metadata: Record<string, unknown> | null;
};

type MediaAsset = {
  type: "image";
  url: string;
  alt: string;
  prompt: string | null;
  status: "ready";
  mediaType: string;
  provider: "upload";
  bucket: string;
  path: string;
  uploadedAt: string;
  fileName: string;
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "bad form data" }, { status: 400 });

  const pieceId = String(formData.get("pieceId") ?? "");
  const file = formData.get("file");
  if (!pieceId) return NextResponse.json({ error: "pieceId is required" }, { status: 400 });
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 400 });
  }

  const { data: piece, error } = await supabase
    .from("content_pieces")
    .select("id, user_id, title, metadata")
    .eq("id", pieceId)
    .eq("user_id", user.id)
    .single();

  if (error || !piece) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const typedPiece = piece as unknown as PieceRow;
  const bytes = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();
  const uploaded = await uploadPostImage({
    supabase: admin,
    userId: typedPiece.user_id,
    pieceId: typedPiece.id,
    bytes,
    contentType: file.type,
    extension: extensionFor(file),
  });
  const uploadedAt = new Date().toISOString();
  const asset: MediaAsset = {
    type: "image",
    url: uploaded.url,
    alt: typedPiece.title,
    prompt: visualPromptFromMetadata(typedPiece.metadata),
    status: "ready",
    mediaType: mediaTypeFromMetadata(typedPiece.metadata),
    provider: "upload",
    bucket: uploaded.bucket,
    path: uploaded.path,
    uploadedAt,
    fileName: file.name,
  };

  const nextMetadata = {
    ...(typedPiece.metadata ?? {}),
    mediaAsset: asset,
    mediaUploadedAt: uploadedAt,
  };

  const { error: pieceUpdateError } = await supabase
    .from("content_pieces")
    .update({ metadata: nextMetadata })
    .eq("id", typedPiece.id)
    .eq("user_id", user.id);

  if (pieceUpdateError) {
    return NextResponse.json(
      { error: "Image uploaded, but the post could not be updated." },
      { status: 500 }
    );
  }

  await admin
    .from("social_relay_posts")
    .update({ media: [asset] })
    .eq("source_app", "irie-stack")
    .eq("source_record_id", typedPiece.id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, asset });
}

function visualPromptFromMetadata(metadata: Record<string, unknown> | null) {
  const prompt = metadata?.visualPrompt;
  return typeof prompt === "string" && prompt.trim() ? prompt.trim() : null;
}

function mediaTypeFromMetadata(metadata: Record<string, unknown> | null) {
  const mediaType = metadata?.mediaType;
  return typeof mediaType === "string" && mediaType.trim() ? mediaType.trim() : "image";
}

function extensionFor(file: File) {
  const byType = file.type.split("/")[1]?.toLowerCase();
  if (byType === "jpeg") return "jpg";
  if (byType === "png" || byType === "webp" || byType === "gif") return byType;
  const byName = file.name.split(".").pop()?.toLowerCase();
  return byName && byName.length <= 5 ? byName : "png";
}
