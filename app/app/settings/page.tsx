import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { PLATFORM_OPTIONS } from "@/lib/platforms";
import type { PlatformDestination } from "@/lib/platform-destinations";
import { PlatformSettingsClient } from "./platform-settings-client";
import { PasswordSettings } from "./password-settings";

type Setting = {
  platform: string;
  mode: "approval" | "autopilot" | "paused";
  is_enabled: boolean;
  updated_at: string;
};

export default async function SettingsPage() {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("platform_settings")
    .select("platform, mode, is_enabled, updated_at")
    .eq("user_id", user.id);

  const existingPlatforms = new Set((existing ?? []).map((row) => row.platform));
  const missing = PLATFORM_OPTIONS.filter((item) => !existingPlatforms.has(item.id));

  if (missing.length > 0) {
    await supabase.from("platform_settings").upsert(
      missing.map((item) => ({
        user_id: user.id,
        platform: item.id,
        mode: "approval",
        is_enabled: true,
      })),
      { onConflict: "user_id,platform" }
    );
  }

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("platform, mode, is_enabled, updated_at")
    .eq("user_id", user.id)
    .order("platform", { ascending: true });

  const { data: destinations } = await supabase
    .from("platform_destinations")
    .select(
      "id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata"
    )
    .eq("user_id", user.id)
    .order("platform", { ascending: true })
    .order("label", { ascending: true });

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">Settings</p>
          <h1 className="workspace-title">Account and posting settings.</h1>
          <p className="workspace-copy">
            Manage login basics and choose where posts can go.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <PasswordSettings />
        <section>
          <div className="mb-3">
            <p className="workspace-kicker">Social Accounts</p>
            <h2 className="text-xl font-semibold text-text-primary">
              Platform posting modes
            </h2>
          </div>
          <PlatformSettingsClient
            initialSettings={(settings ?? []) as Setting[]}
            destinations={(destinations ?? []) as PlatformDestination[]}
          />
        </section>
      </div>
    </div>
  );
}
