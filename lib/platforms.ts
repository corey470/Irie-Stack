export const PLATFORM_OPTIONS = [
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "substack", label: "Substack" },
] as const;

export const PLATFORM_MODES = ["approval", "autopilot", "paused"] as const;

export type PlatformId = (typeof PLATFORM_OPTIONS)[number]["id"];
export type PlatformMode = (typeof PLATFORM_MODES)[number];

export function platformLabel(platform: string) {
  return PLATFORM_OPTIONS.find((item) => item.id === platform)?.label ?? platform;
}
