import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { createMemory, memoryIsConfigured } from "@/lib/memory-client";

type RunRow = {
  id: string;
  name: string;
  summary: string | null;
  target_days: number;
  starts_on: string;
  created_at: string;
};

type PieceRow = {
  platform: string;
  level: string;
  format: string;
  title: string;
  scheduled_for: string | null;
  validation: { ok?: boolean } | null;
};

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { runId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  if (!memoryIsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Memory API is not configured. Set MEMORY_API_URL and MEMORY_ADMIN_TOKEN.",
      },
      { status: 503 }
    );
  }

  const { data: run, error: runError } = await supabase
    .from("content_runs")
    .select("id, name, summary, target_days, starts_on, created_at")
    .eq("id", body.runId)
    .eq("user_id", user.id)
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }

  const { data: pieces, error: piecesError } = await supabase
    .from("content_pieces")
    .select("platform, level, format, title, scheduled_for, validation")
    .eq("run_id", body.runId)
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (piecesError) {
    return NextResponse.json({ error: "pieces not found" }, { status: 404 });
  }

  const typedRun = run as RunRow;
  const typedPieces = (pieces ?? []) as PieceRow[];
  const platformCounts = countBy(typedPieces, "platform");
  const levelCounts = countBy(typedPieces, "level");
  const flaggedCount = typedPieces.filter(
    (piece) => piece.validation?.ok === false
  ).length;

  let memory;
  try {
    memory = await createMemory({
      title: `IrieStack run: ${typedRun.name}`,
      entity: `irie-stack:user:${user.id}`,
      source: "irie-stack",
      importance: 4,
      tags: ["irie-stack", "content-run", "social-publishing"],
      content: JSON.stringify(
        {
          run: typedRun,
          pieceCount: typedPieces.length,
          platformCounts,
          levelCounts,
          flaggedCount,
          pieceTitles: typedPieces.map((piece) => ({
            title: piece.title,
            platform: piece.platform,
            level: piece.level,
            format: piece.format,
            scheduledFor: piece.scheduled_for,
          })),
        },
        null,
        2
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Memory save failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, memoryId: memory.id });
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
