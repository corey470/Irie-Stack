import { PLATFORM_LIMITS, type Platform } from "@/lib/content-engine";

export const RELAY_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "scheduled",
  "posted",
  "rejected",
  "failed",
] as const;

export type RelayStatus = (typeof RELAY_STATUSES)[number];

export type RelayPost = {
  id: string;
  user_id?: string;
  platform: Platform;
  title: string;
  body: string;
  media: RelayMedia[];
  status: RelayStatus;
  mode: "approval" | "autopilot";
  scheduled_for: string | null;
  validation: RelayValidation;
  metadata: Record<string, unknown> | null;
  destination_id?: string | null;
};

export type RelayMedia = {
  type: "image" | "video" | "link";
  url: string | null;
  alt?: string;
  prompt?: string;
  status?: "needs_asset" | "ready" | "failed";
  mediaType?: string;
  provider?: string;
};

export type RelayValidation = {
  ok: boolean;
  actualChars: number;
  maxChars: number | null;
  errors: string[];
  warnings: string[];
};

export function validateRelayPost({
  platform,
  body,
  media = [],
}: {
  platform: Platform;
  body: string;
  media?: RelayMedia[];
}): RelayValidation {
  const maxChars = PLATFORM_LIMITS[platform];
  const errors: string[] = [];
  const warnings: string[] = [];
  const actualChars = body.length;

  if (maxChars && actualChars > maxChars) {
    errors.push(`${platform} post is ${actualChars}/${maxChars} chars.`);
  }

  if ((platform === "instagram" || platform === "tiktok") && media.length === 0) {
    warnings.push(`${platform} usually needs image or video media before direct posting.`);
  }

  return {
    ok: errors.length === 0,
    actualChars,
    maxChars,
    errors,
    warnings,
  };
}
