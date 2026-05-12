import { facebookPostingIsConfiguredFor } from "@/lib/facebook-client";
import type { PlatformDestination } from "@/lib/platform-destinations";
import {
  schedulerFallbackIsConfigured,
  schedulerFallbackIsConfiguredFor,
} from "@/lib/scheduler-fallback-client";
import { xPostingIsConfigured } from "@/lib/x-client";

export function postingIsConfiguredFor(
  platform: string,
  destination?: PlatformDestination | null
) {
  if (platform === "x") return xPostingIsConfigured();
  if (platform === "facebook") {
    return facebookPostingIsConfiguredFor({
      pageId: destination?.external_id,
      pageAccessTokenEnvKey: destination?.access_token_env_key,
    });
  }
  if (destination?.posting_strategy === "scheduler") {
    return schedulerFallbackIsConfiguredFor(destination.scheduler_profile_id_env_key);
  }
  return schedulerFallbackIsConfigured();
}

export function missingPostingConfigMessage(
  platform: string,
  destination?: PlatformDestination | null
) {
  if (platform === "x") return "X posting is not configured. Set X_ACCESS_TOKEN.";
  if (platform === "facebook") {
    if (destination?.access_token_env_key) {
      return `Facebook posting is not configured. Set ${destination.access_token_env_key}.`;
    }
    return "Facebook posting is not configured. Set a Facebook destination plus FACEBOOK_PAGE_ACCESS_TOKEN.";
  }
  if (destination?.scheduler_profile_id_env_key) {
    return `Scheduler fallback is not configured for ${platform}. Set BUFFER_ACCESS_TOKEN and ${destination.scheduler_profile_id_env_key}.`;
  }
  return `Scheduler fallback is not configured for ${platform}. Set BUFFER_ACCESS_TOKEN and BUFFER_${platform.toUpperCase()}_PROFILE_ID.`;
}
