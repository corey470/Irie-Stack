import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppContext } from "@/lib/app-auth";
import { PLATFORM_MODES, PLATFORM_OPTIONS, type PlatformMode } from "@/lib/platforms";

export async function GET() {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const settings = await ensurePlatformSettings(supabase, user.id);
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { platform?: string; mode?: string; is_enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const platform = PLATFORM_OPTIONS.find((item) => item.id === body.platform)?.id;
  const mode = PLATFORM_MODES.includes(body.mode as PlatformMode)
    ? (body.mode as PlatformMode)
    : null;

  if (!platform || !mode) {
    return NextResponse.json({ error: "invalid platform settings" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .upsert(
      {
        user_id: user.id,
        platform,
        mode,
        is_enabled: body.is_enabled ?? mode !== "paused",
      },
      { onConflict: "user_id,platform" }
    )
    .select("platform, mode, is_enabled, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  return NextResponse.json({ setting: data });
}

async function ensurePlatformSettings(supabase: SupabaseClient, userId: string) {
  const { data: existing } = await supabase
    .from("platform_settings")
    .select("platform, mode, is_enabled, updated_at")
    .eq("user_id", userId);

  const existingPlatforms = new Set((existing ?? []).map((row) => row.platform));
  const missing = PLATFORM_OPTIONS.filter((item) => !existingPlatforms.has(item.id));

  if (missing.length > 0) {
    await supabase.from("platform_settings").upsert(
      missing.map((item) => ({
        user_id: userId,
        platform: item.id,
        mode: "approval",
        is_enabled: true,
      })),
      { onConflict: "user_id,platform" }
    );
  }

  const { data } = await supabase
    .from("platform_settings")
    .select("platform, mode, is_enabled, updated_at")
    .eq("user_id", userId)
    .order("platform", { ascending: true });

  return data ?? [];
}
