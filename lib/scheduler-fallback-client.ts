import type { PlatformId } from "@/lib/platforms";

export type SchedulerFallbackResult = {
  id: string;
  url: string | null;
  raw: unknown;
};

export function schedulerFallbackIsConfigured() {
  return Boolean(process.env.BUFFER_ACCESS_TOKEN);
}

export function schedulerFallbackIsConfiguredFor(profileIdEnvKey?: string | null) {
  if (!process.env.BUFFER_ACCESS_TOKEN) return false;
  if (!profileIdEnvKey) return true;
  return Boolean(process.env[profileIdEnvKey]);
}

export async function createBufferUpdate({
  text,
  platform,
  profileIdEnvKey,
}: {
  text: string;
  platform: PlatformId;
  profileIdEnvKey?: string | null;
}): Promise<SchedulerFallbackResult> {
  const accessToken = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = profileIdForPlatform(platform, profileIdEnvKey);

  if (!accessToken || !profileId) {
    throw new Error(
      `Buffer fallback is not configured for ${platform}. Set BUFFER_ACCESS_TOKEN and ${
        profileIdEnvKey ?? bufferProfileEnv(platform)
      }.`
    );
  }

  const params = new URLSearchParams();
  params.set("text", text);
  params.set("profile_ids[]", profileId);
  params.set("now", "false");

  const response = await fetch("https://api.bufferapp.com/1/updates/create.json", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      raw && typeof raw === "object" && "message" in raw
        ? String(raw.message)
        : `Buffer API returned ${response.status}`;
    throw new Error(message);
  }

  const update =
    raw && typeof raw === "object" && "updates" in raw && Array.isArray(raw.updates)
      ? (raw.updates[0] as Record<string, unknown> | undefined)
      : undefined;

  const id =
    update && typeof update.id === "string"
      ? update.id
      : raw && typeof raw === "object" && "id" in raw && typeof raw.id === "string"
        ? raw.id
        : null;

  if (!id) throw new Error("Buffer API returned no update id.");

  return { id, url: null, raw };
}

function bufferProfileEnv(platform: PlatformId) {
  return `BUFFER_${platform.toUpperCase()}_PROFILE_ID`;
}

function profileIdForPlatform(platform: PlatformId, profileIdEnvKey?: string | null) {
  const envName = profileIdEnvKey ?? bufferProfileEnv(platform);
  return process.env[envName];
}
