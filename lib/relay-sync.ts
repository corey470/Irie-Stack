import type { SupabaseClient } from "@supabase/supabase-js";
import { hasRequiredMedia, isPublishSupported } from "@/lib/post-eligibility";

type RelayPiece = {
  id: string | null;
  platform: string;
  level: string;
  format: string;
  title: string;
  body: string;
  visual_prompt?: string;
  media_type?: "none" | "image" | "carousel" | "video";
  scheduled_for: string;
  scheduled_day?: number;
  validation: unknown;
};

type PieceRow = {
  id: string;
  position?: number;
};

export async function createRelayPostsForContentPieces({
  supabase,
  userId,
  runId,
  pieces,
  pieceRows,
  destinationByPlatform,
  platformModeByPlatform,
}: {
  supabase: SupabaseClient;
  userId: string;
  runId: string;
  pieces: RelayPiece[];
  pieceRows: PieceRow[];
  destinationByPlatform: Map<string, string>;
  platformModeByPlatform?: Map<string, "approval" | "autopilot" | "paused">;
}) {
  const rows = pieces
    .map((piece, index) => {
      const pieceId = pieceRows[index]?.id;
      if (!pieceId) return null;
      const behavior = behaviorForRelay(
        platformModeByPlatform?.get(piece.platform),
        validationOk(piece.validation),
        piece
      );

      return {
        user_id: userId,
        destination_id: destinationByPlatform.get(piece.platform) ?? null,
        source_app: "irie-stack",
        source_record_id: pieceId,
        platform: piece.platform,
        title: piece.title,
        body: piece.body,
        status: behavior.status,
        mode: behavior.mode,
        scheduled_for: piece.scheduled_for,
        media: mediaFromPiece(piece),
        validation: piece.validation,
        metadata: {
          runId,
          contentPieceId: pieceId,
          level: piece.level,
          format: piece.format,
          mediaType: piece.media_type ?? "image",
          visualPrompt: piece.visual_prompt ?? null,
          scheduledDay: piece.scheduled_day ?? null,
          platformMode: behavior.platformMode,
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (rows.length === 0) return { ok: true, count: 0 };

  const { error } = await supabase.from("social_relay_posts").insert(rows);
  if (error) return { ok: false, count: 0, error: error.message };
  return { ok: true, count: rows.length };
}

function validationOk(validation: unknown) {
  return Boolean(
    validation &&
      typeof validation === "object" &&
      "ok" in validation &&
      (validation as { ok?: unknown }).ok === true
  );
}

function behaviorForRelay(
  mode: "approval" | "autopilot" | "paused" | undefined,
  ok: boolean,
  piece: RelayPiece
) {
  const platformMode = mode ?? "approval";
  if (platformMode === "autopilot" && ok && isAutopilotEligible(piece)) {
    return { status: "approved" as const, mode: "autopilot" as const, platformMode };
  }
  return { status: "draft" as const, mode: "approval" as const, platformMode };
}

function isAutopilotEligible(piece: RelayPiece) {
  return (
    isPublishSupported(piece) &&
    hasRequiredMedia({
      platform: piece.platform,
      format: piece.format,
      metadata: { mediaType: piece.media_type ?? "image" },
    })
  );
}

function mediaFromPiece(piece: RelayPiece) {
  if (!piece.visual_prompt || piece.media_type === "none") return [];

  return [
    {
      type: "image",
      url: null,
      status: "needs_asset",
      prompt: piece.visual_prompt,
      mediaType: piece.media_type ?? "image",
    },
  ];
}

export async function syncRelayPostForContentPiece({
  supabase,
  pieceId,
  status,
  mode,
  metadata,
  postedAt,
  postedUrl,
  errorMessage,
}: {
  supabase: SupabaseClient;
  pieceId: string;
  status: "draft" | "pending_approval" | "approved" | "posted" | "rejected" | "failed";
  mode?: "approval" | "autopilot";
  metadata?: Record<string, unknown>;
  postedAt?: string | null;
  postedUrl?: string | null;
  errorMessage?: string | null;
}) {
  const patch: Record<string, unknown> = {
    status,
    ...(mode ? { mode } : {}),
    ...(postedAt !== undefined ? { posted_at: postedAt } : {}),
    ...(postedUrl !== undefined ? { posted_url: postedUrl } : {}),
    ...(errorMessage !== undefined ? { error_message: errorMessage } : {}),
  };

  if (metadata) {
    patch.metadata = metadata;
  }

  return supabase
    .from("social_relay_posts")
    .update(patch)
    .eq("source_app", "irie-stack")
    .eq("source_record_id", pieceId);
}
