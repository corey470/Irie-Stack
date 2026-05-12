export type PlatformDestination = {
  id: string;
  user_id?: string;
  platform: string;
  label: string;
  external_id: string | null;
  external_type: "profile" | "page" | "company_page" | "scheduler_profile" | "publication";
  posting_strategy: "direct" | "scheduler";
  access_token_env_key: string | null;
  scheduler_profile_id_env_key: string | null;
  is_default: boolean;
  metadata: Record<string, unknown> | null;
};

export function maskedExternalId(value: string | null | undefined) {
  if (!value) return "Not set";
  if (value.startsWith("env:")) return "Env secured";
  if (value.length <= 4) return "Set";
  return `••••${value.slice(-4)}`;
}

export function destinationLabel(destination: PlatformDestination | null | undefined) {
  if (!destination) return "Default destination";
  const suffix = destination.external_id ? ` (${maskedExternalId(destination.external_id)})` : "";
  return `${destination.label}${suffix}`;
}
