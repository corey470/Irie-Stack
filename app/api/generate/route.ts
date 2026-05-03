import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAnthropic, GENERATION_MODEL } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserPrompt,
  PLATFORMS,
  type Platform,
} from "@/lib/generate-prompt";

type GeneratedPost = { platform: Platform; body: string };

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const source = (body.source ?? "").trim();
  if (!source || source.length < 20) {
    return NextResponse.json(
      { error: "Source content needs at least 20 characters." },
      { status: 400 }
    );
  }
  if (source.length > 12000) {
    return NextResponse.json(
      { error: "Source content can't exceed 12,000 characters." },
      { status: 400 }
    );
  }

  // Load the user's Context Stack
  const { data: stack } = await supabase
    .from("context_stacks")
    .select("id, voice_notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Create a job row up front so we have a paper trail
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      stack_id: stack?.id ?? null,
      status: "running",
      payload: { source, generated: null },
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    console.error("job create failed:", jobErr);
    return NextResponse.json({ error: "couldn't start job" }, { status: 500 });
  }

  // Call Claude
  let posts: GeneratedPost[] = [];
  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 4096,
      system: buildSystemPrompt(stack?.voice_notes ?? ""),
      messages: [{ role: "user", content: buildUserPrompt(source) }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    posts = parsePosts(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "generation failed";
    await supabase
      .from("jobs")
      .update({ status: "failed", error: msg })
      .eq("id", job.id);
    console.error("generation failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Persist the result
  await supabase
    .from("jobs")
    .update({
      status: "completed",
      payload: { source, generated: posts },
    })
    .eq("id", job.id);

  return NextResponse.json({ jobId: job.id, posts });
}

function parsePosts(raw: string): GeneratedPost[] {
  // Strip any accidental code fences
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Couldn't parse the model's response as JSON. Try regenerating."
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("posts" in parsed) ||
    !Array.isArray((parsed as { posts: unknown }).posts)
  ) {
    throw new Error("Model returned an unexpected shape.");
  }

  const valid = new Set<string>(PLATFORMS.map((p) => p.name));
  return (parsed as { posts: { platform: string; body: string }[] }).posts
    .filter(
      (p) =>
        p &&
        typeof p.platform === "string" &&
        typeof p.body === "string" &&
        valid.has(p.platform)
    )
    .map((p) => ({ platform: p.platform as Platform, body: p.body.trim() }));
}
