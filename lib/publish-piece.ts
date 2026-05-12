import { postToFacebook } from "@/lib/facebook-client";
import type { PlatformDestination } from "@/lib/platform-destinations";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { createBufferUpdate } from "@/lib/scheduler-fallback-client";
import { postToX } from "@/lib/x-client";
import type { PlatformId } from "@/lib/platforms";
import type { RelayMedia } from "@/lib/social-relay";

export type PublishablePiece = {
  id: string;
  user_id?: string;
  platform: string;
  format?: string;
  status: string;
  body: string;
  validation: { ok?: boolean } | null;
  media?: RelayMedia[] | null;
  metadata: Record<string, unknown> | null;
  destination_id?: string | null;
  destination?: PlatformDestination | PlatformDestination[] | null;
};

export type PublishResult = {
  postedUrl: string | null;
  platformPostId: string;
  metadata: Record<string, unknown>;
};

export async function publishPiece(piece: PublishablePiece): Promise<PublishResult> {
  if (piece.status !== "approved") {
    throw new Error("Piece must be approved before posting.");
  }

  if (piece.validation?.ok === false) {
    throw new Error("Piece has validation errors.");
  }
  const blockedReason = approvalBlockReason(piece);
  if (blockedReason) throw new Error(blockedReason);

  const destination = normalizeDestination(piece.destination);
  const imageUrl = firstReadyImageUrl(piece);
  const result =
    piece.platform === "x"
      ? await postToX(piece.body)
      : piece.platform === "facebook"
        ? await postToFacebook(piece.body, {
            pageId: destination?.external_id,
            pageAccessTokenEnvKey: destination?.access_token_env_key,
            imageUrl,
          })
        : await createBufferUpdate({
            text: piece.body,
            platform: piece.platform as PlatformId,
            profileIdEnvKey: destination?.scheduler_profile_id_env_key,
          });
  const postedAt = new Date().toISOString();

  return {
    postedUrl: result.url,
    platformPostId: result.id,
    metadata: {
      ...(piece.metadata ?? {}),
      publish: {
        platform: piece.platform,
        destinationId: piece.destination_id ?? destination?.id ?? null,
        destinationLabel: destination?.label ?? null,
        postId: result.id,
        postedAt,
        raw: result.raw,
      },
    },
  };
}

function firstReadyImageUrl(piece: PublishablePiece) {
  const direct = piece.media?.find(
    (item) => item.type === "image" && item.url && item.status !== "needs_asset"
  )?.url;
  if (direct) return direct;

  const asset = piece.metadata?.mediaAsset;
  if (
    asset &&
    typeof asset === "object" &&
    "url" in asset &&
    typeof (asset as { url?: unknown }).url === "string"
  ) {
    return (asset as { url: string }).url;
  }

  return null;
}

export function normalizeDestination(
  destination: PublishablePiece["destination"]
): PlatformDestination | null {
  if (Array.isArray(destination)) return destination[0] ?? null;
  return destination ?? null;
}
