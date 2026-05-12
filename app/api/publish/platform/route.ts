import { NextResponse } from "next/server";
import {
  normalizeDestination,
  publishPiece,
  type PublishablePiece,
} from "@/lib/publish-piece";
import {
  missingPostingConfigMessage,
  postingIsConfiguredFor,
} from "@/lib/posting-config";
import { syncRelayPostForContentPiece } from "@/lib/relay-sync";
import { getAppContext } from "@/lib/app-auth";

type PieceRow = {
  id: string;
  user_id: string;
  platform: string;
  format: string;
  status: string;
  body: string;
  validation: { ok?: boolean } | null;
  metadata: Record<string, unknown> | null;
  destination_id: string | null;
  destination: PublishablePiece["destination"];
};

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { pieceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.pieceId) {
    return NextResponse.json({ error: "pieceId is required" }, { status: 400 });
  }

  const { data: piece, error: pieceError } = await supabase
    .from("content_pieces")
    .select(
      "id, user_id, platform, format, status, body, validation, metadata, destination_id, destination:platform_destinations(id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata)"
    )
    .eq("id", body.pieceId)
    .eq("user_id", user.id)
    .single();

  if (pieceError || !piece) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const typedPiece = piece as unknown as PieceRow;
  const destination = normalizeDestination(typedPiece.destination);
  if (!postingIsConfiguredFor(typedPiece.platform, destination)) {
    return NextResponse.json(
      { error: missingPostingConfigMessage(typedPiece.platform, destination) },
      { status: 503 }
    );
  }

  let result;
  try {
    result = await publishPiece(typedPiece);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Posting failed.";
    await supabase
      .from("content_pieces")
      .update({
        status: "failed",
        metadata: {
          ...(typedPiece.metadata ?? {}),
          publishError: {
            platform: typedPiece.platform,
            message,
            failedAt: new Date().toISOString(),
          },
        },
      })
      .eq("id", typedPiece.id)
      .eq("user_id", user.id);
    await syncRelayPostForContentPiece({
      supabase,
      pieceId: typedPiece.id,
      status: "failed",
      errorMessage: message,
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }

  const postedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      status: "posted",
      posted_at: postedAt,
      posted_url: result.postedUrl,
      metadata: result.metadata,
    })
    .eq("id", typedPiece.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Posted, but piece update failed." },
      { status: 500 }
    );
  }

  await syncRelayPostForContentPiece({
    supabase,
    pieceId: typedPiece.id,
    status: "posted",
    postedAt,
    postedUrl: result.postedUrl,
  });

  return NextResponse.json({
    ok: true,
    pieceId: typedPiece.id,
    platform: typedPiece.platform,
    postedUrl: result.postedUrl,
    platformPostId: result.platformPostId,
  });
}
