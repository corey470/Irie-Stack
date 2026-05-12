import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { validatePiece, type GeneratedPiece } from "@/lib/content-engine";

type UpdateBody = {
  title?: string;
  body?: string;
};

type PieceRow = GeneratedPiece & {
  id: string;
  user_id: string;
  status: string;
  approval_status: string | null;
  metadata: Record<string, unknown> | null;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const nextTitle = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const nextBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!nextTitle) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (nextBody.length < 1) return NextResponse.json({ error: "Post body is required." }, { status: 400 });
  if (nextBody.length > 12000) return NextResponse.json({ error: "Post body is too long." }, { status: 400 });

  const { data: piece, error: fetchError } = await supabase
    .from("content_pieces")
    .select("id, user_id, platform, level, format, title, hook, body, cta, slides, status, approval_status, metadata")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("piece fetch failed:", fetchError);
    return NextResponse.json({ error: "Could not load that post." }, { status: 500 });
  }
  if (!piece) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const current = piece as unknown as PieceRow;
  if (current.status === "posted") {
    return NextResponse.json({ error: "Posted posts cannot be edited here." }, { status: 400 });
  }

  const candidate: GeneratedPiece = {
    platform: current.platform,
    level: current.level,
    format: current.format,
    title: nextTitle,
    hook: current.hook,
    body: nextBody,
    cta: current.cta,
    visual_prompt: typeof current.metadata?.visualPrompt === "string"
      ? current.metadata.visualPrompt
      : undefined,
    media_type: normalizeMediaType(current.metadata?.mediaType),
    slides: Array.isArray(current.slides) ? current.slides : [],
  };
  const validation = validatePiece(candidate);
  const now = new Date().toISOString();
  const nextMetadata = {
    ...(current.metadata ?? {}),
    editedAt: now,
    editedBy: "user",
  };

  const { data: updated, error: updateError } = await supabase
    .from("content_pieces")
    .update({
      title: nextTitle,
      body: nextBody,
      validation,
      metadata: nextMetadata,
      status: "draft",
      approval_status: "not_requested",
      approval_request_id: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, body, status, approval_status, validation, metadata")
    .single();

  if (updateError || !updated) {
    console.error("piece update failed:", updateError);
    return NextResponse.json({ error: "Could not save that post." }, { status: 500 });
  }

  const { error: relayError } = await supabase
    .from("social_relay_posts")
    .update({
      title: nextTitle,
      body: nextBody,
      validation,
      status: "draft",
    })
    .eq("source_app", "irie-stack")
    .eq("source_record_id", id);

  if (relayError) {
    console.error("relay update failed:", relayError);
  }

  return NextResponse.json({ ok: true, piece: updated, relaySynced: !relayError });
}

function normalizeMediaType(value: unknown): GeneratedPiece["media_type"] {
  return value === "none" ||
    value === "image" ||
    value === "carousel" ||
    value === "video"
    ? value
    : "image";
}
