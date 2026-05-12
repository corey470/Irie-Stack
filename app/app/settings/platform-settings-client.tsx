"use client";

import { useState } from "react";
import {
  maskedExternalId,
  type PlatformDestination,
} from "@/lib/platform-destinations";
import { PLATFORM_OPTIONS, PLATFORM_MODES, platformLabel, type PlatformMode } from "@/lib/platforms";

type Setting = {
  platform: string;
  mode: PlatformMode;
  is_enabled: boolean;
  updated_at: string;
};

export function PlatformSettingsClient({
  initialSettings,
  destinations,
}: {
  initialSettings: Setting[];
  destinations: PlatformDestination[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(platform: string, mode: PlatformMode) {
    if (mode === "autopilot") {
      const confirmed = window.confirm(
        `${platformLabel(platform)} autopilot skips manual review for clean posts. Posts still needing images or fixes stay blocked. Turn it on?`
      );
      if (!confirmed) return;
    }
    setSaving(platform);
    setError(null);

    try {
      const res = await fetch("/api/settings/platforms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          mode,
          is_enabled: mode !== "paused",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Save failed.");

      setSettings((current) =>
        current.map((item) =>
          item.platform === platform
            ? {
                ...item,
                mode,
                is_enabled: mode !== "paused",
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {PLATFORM_OPTIONS.map((platform) => {
        const setting =
          settings.find((item) => item.platform === platform.id) ??
          ({
            platform: platform.id,
            mode: "approval",
            is_enabled: true,
            updated_at: "",
          } as Setting);

        return (
          <section
            key={platform.id}
            className="rounded-md border border-border bg-bg-surface p-4 shadow-card"
          >
            <div className="grid gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-text-primary">
                  {platformLabel(platform.id)}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {descriptionFor(setting.mode)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {adapterHint(platform.id)}
                </p>
                <DestinationList
                  destinations={destinations.filter((item) => item.platform === platform.id)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORM_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update(platform.id, mode)}
                    disabled={saving === platform.id}
                    aria-pressed={setting.mode === mode}
                    className={`min-h-11 rounded-md border px-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                      setting.mode === mode
                        ? "border-border-strong bg-bg-active text-text-primary"
                        : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover"
                    }`}
                  >
                    {pretty(mode)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        );
      })}
      {error && <p className="text-sm text-destructive lg:col-span-2">{error}</p>}
    </div>
  );
}

function DestinationList({ destinations }: { destinations: PlatformDestination[] }) {
  if (destinations.length === 0) {
    return (
      <p className="mt-3 text-xs text-text-muted">
        No named destinations saved yet.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {destinations.map((destination) => (
        <span
          key={destination.id}
          className="rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text-secondary"
        >
          {destination.label}
          {" · "}
          {maskedExternalId(destination.external_id)}
          {destination.is_default ? " · default" : ""}
        </span>
      ))}
    </div>
  );
}

function adapterHint(platform: string) {
  if (platform === "x") return "Direct posting is available after your X account is connected.";
  if (platform === "facebook") {
    return "Direct posting is available for saved Facebook Page destinations.";
  }
  if (platform === "tiktok") {
    return "Video posts can be staged for delivery once the account connection is ready.";
  }
  return "Posts can be staged for delivery once the account connection is ready.";
}

function descriptionFor(mode: PlatformMode) {
  if (mode === "autopilot") {
    return "Clean pieces skip approval and can move straight into the posting queue.";
  }
  if (mode === "paused") {
    return "New pieces for this platform stay drafted until you change the mode.";
  }
  return "Pieces request approval before posting.";
}

function pretty(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
