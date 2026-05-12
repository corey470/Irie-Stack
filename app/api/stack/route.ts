import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";

export async function GET() {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data, error } = await supabase
    .from("context_stacks")
    .select("id, name, voice_notes, profile, links, onboarding_completed_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("stack get failed:", error);
    return NextResponse.json({ error: "load failed" }, { status: 500 });
  }

  return NextResponse.json({ stack: data });
}

export async function PUT(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: {
    name?: string;
    voice_notes?: string;
    profile?: Record<string, unknown>;
    links?: unknown[];
    onboarding_completed_at?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // Find or create the user's stack.
  const { data: existing } = await supabase
    .from("context_stacks")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name.slice(0, 120);
  if (typeof body.voice_notes === "string")
    update.voice_notes = body.voice_notes.slice(0, 20000);
  if (body.profile && typeof body.profile === "object") {
    update.profile = body.profile;
  }
  if (Array.isArray(body.links)) {
    update.links = body.links.slice(0, 40);
  }
  if (body.onboarding_completed_at === null || typeof body.onboarding_completed_at === "string") {
    update.onboarding_completed_at = body.onboarding_completed_at;
  }

  if (existing) {
    const { error } = await supabase
      .from("context_stacks")
      .update(update)
      .eq("id", existing.id);
    if (error) {
      console.error("stack update failed:", error);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("context_stacks").insert({
      user_id: user.id,
      name: update.name ?? "My Stack",
      voice_notes: update.voice_notes ?? "",
      profile: update.profile ?? {},
      links: update.links ?? [],
      onboarding_completed_at: update.onboarding_completed_at ?? null,
    });
    if (error) {
      console.error("stack insert failed:", error);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
