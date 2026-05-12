type PieceLike = {
  platform?: string | null;
  format?: string | null;
  metadata?: Record<string, unknown> | null;
  media?: unknown[] | null;
};

const DIRECT_OR_FALLBACK_PLATFORMS = new Set([
  "x",
  "facebook",
  "linkedin",
  "threads",
  "instagram",
  "tiktok",
  "substack",
]);

export function hasRequiredMedia(piece: PieceLike) {
  const mediaType = normalizeString(piece.metadata?.mediaType);
  const platform = normalizeString(piece.platform);
  const needsPlatformMedia = platform === "instagram" || platform === "tiktok";
  if ((!mediaType || mediaType === "none") && !needsPlatformMedia) return true;

  const asset = piece.metadata?.mediaAsset;
  if (
    asset &&
    typeof asset === "object" &&
    typeof (asset as { url?: unknown }).url === "string" &&
    (asset as { url: string }).url.trim()
  ) {
    return true;
  }

  return Boolean(
    piece.media?.some((item) => {
      if (!item || typeof item !== "object") return false;
      const media = item as { url?: unknown; status?: unknown };
      return (
        typeof media.url === "string" &&
        media.url.trim() &&
        media.status !== "needs_asset" &&
        media.status !== "failed"
      );
    })
  );
}

export function isPublishSupported(piece: PieceLike) {
  if (piece.format === "thread") return false;
  return DIRECT_OR_FALLBACK_PLATFORMS.has(String(piece.platform ?? ""));
}

export function approvalBlockReason(piece: PieceLike) {
  if (!isPublishSupported(piece)) return "This format is not ready for automatic publishing yet.";
  if (!hasRequiredMedia(piece)) return "Upload the image or video before approval.";
  return null;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
