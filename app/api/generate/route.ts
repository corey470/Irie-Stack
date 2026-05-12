import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { createServerClient } from "@/lib/supabase/server";
import { getAnthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/generate-prompt";
import { resolveSourceInput, type SourceInput } from "@/lib/source-fetcher";
import {
  parseGeneratedRun,
  scheduledDateForDay,
  validatePiece,
  type GeneratedPiece,
  type GeneratedRun,
  type PieceValidation,
} from "@/lib/content-engine";
import { hasRequiredMedia, isPublishSupported } from "@/lib/post-eligibility";
import { createRelayPostsForContentPieces } from "@/lib/relay-sync";

const APPROVAL_CADENCES = ["monthly", "weekly", "daily", "individual", "autopilot"] as const;
const DEFAULT_POSTING_TIMES = ["09:00", "12:00", "15:00", "18:00"];

type ApiPiece = GeneratedPiece & {
  id: string | null;
  scheduled_for: string;
  validation: PieceValidation;
  status: "draft" | "needs_revision";
};

type ApprovalCadence = (typeof APPROVAL_CADENCES)[number];

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: {
    source?: string;
    sourceUrl?: string;
    rightsConfirmed?: boolean;
    approvalCadence?: string;
    postingTimes?: string[];
    timezoneOffsetMinutes?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (body.rightsConfirmed !== true) {
    return NextResponse.json(
      { error: "Confirm you own or have permission to use the source content." },
      { status: 400 }
    );
  }

  let resolvedSource: SourceInput;
  try {
    resolvedSource = await resolveSourceInput({
      source: body.source,
      sourceUrl: body.sourceUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load source.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const source = resolvedSource.text.trim();
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

  const startsOn = new Date();
  const approvalCadence = normalizeApprovalCadence(body.approvalCadence);
  const postingTimes = normalizePostingTimes(body.postingTimes);
  const timezoneOffsetMinutes = typeof body.timezoneOffsetMinutes === "number"
    && Number.isFinite(body.timezoneOffsetMinutes)
    ? body.timezoneOffsetMinutes
    : 0;

  // Load the user's Context Stack.
  const { data: stack } = await supabase
    .from("context_stacks")
    .select("id, voice_notes, profile, links")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Create a job row up front so we have a paper trail.
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      stack_id: stack?.id ?? null,
      status: "running",
      payload: { source, sourceType: resolvedSource.type, generated: null },
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    console.error("job create failed:", jobErr);
    return NextResponse.json({ error: "couldn't start job" }, { status: 500 });
  }

  let generatedRun: GeneratedRun;
  try {
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 12000,
      system: buildSystemPrompt(
        stack?.voice_notes ?? "",
        (stack?.profile ?? {}) as Record<string, unknown>,
        (stack?.links ?? []) as unknown[]
      ),
      messages: [{ role: "user", content: buildUserPrompt(source) }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    generatedRun = parseGeneratedRun(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "generation failed";
    await supabase
      .from("jobs")
      .update({ status: "failed", error: msg })
      .eq("id", job.id);
    console.error("generation failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const pieces: ApiPiece[] = generatedRun.pieces.map((piece, index) => {
    const validation = validatePiece(piece);
    return {
      ...piece,
      id: null,
      scheduled_for: scheduledDateForDay(startsOn, piece.scheduled_day, index, {
        postingTimes,
        timezoneOffsetMinutes,
      }),
      validation,
      status: validation.ok ? "draft" : "needs_revision",
    };
  });

  const persistence = await persistRun({
    supabase,
    userId: user.id,
    stackId: stack?.id ?? null,
    jobId: job.id,
    source,
    run: generatedRun,
    pieces,
    startsOn,
    sourceInput: resolvedSource,
    approvalCadence,
    postingTimes,
    timezoneOffsetMinutes,
  });

  await supabase
    .from("jobs")
    .update({
      status: "completed",
      payload: {
        source,
        sourceType: resolvedSource.type,
        sourceMetadata: resolvedSource.metadata,
        run: generatedRun,
        pieces,
        persistence,
        approvalCadence,
        postingTimes,
        timezoneOffsetMinutes,
      },
    })
    .eq("id", job.id);

  return NextResponse.json({
    jobId: job.id,
    runId: persistence.runId,
    persisted: persistence.ok,
    persistenceWarning: persistence.warning,
    run: {
      id: persistence.runId,
      name: generatedRun.run_name,
      summary: generatedRun.summary,
      starts_on: startsOn.toISOString().slice(0, 10),
      target_days: 30,
      source_type: resolvedSource.type,
      source_metadata: resolvedSource.metadata,
      approval_cadence: approvalCadence,
      posting_times: postingTimes,
    },
    pieces: pieces.map((piece, index) => ({
      ...piece,
      id: persistence.pieceIds[index] ?? null,
      approval_request_id: null,
      approval_status: null,
      posted_url: null,
    })),
  });
}

async function persistRun({
  supabase,
  userId,
  stackId,
  jobId,
  source,
  run,
  pieces,
  startsOn,
  sourceInput,
  approvalCadence,
  postingTimes,
  timezoneOffsetMinutes,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  userId: string;
  stackId: string | null;
  jobId: string;
  source: string;
  run: GeneratedRun;
  pieces: ApiPiece[];
  startsOn: Date;
  sourceInput: SourceInput;
  approvalCadence: ApprovalCadence;
  postingTimes: string[];
  timezoneOffsetMinutes: number;
}): Promise<{
  ok: boolean;
  runId: string | null;
  sourceId: string | null;
  pieceIds: (string | null)[];
  warning?: string;
}> {
  const { data: sourceRow, error: sourceError } = await supabase
    .from("content_sources")
    .insert({
      user_id: userId,
      type: sourceInput.type,
      title: run.run_name,
      input_text: source,
      input_metadata: sourceInput.metadata,
    })
    .select("id")
    .single();

  if (sourceError || !sourceRow) {
    return {
      ok: false,
      runId: null,
      sourceId: null,
      pieceIds: pieces.map(() => null),
      warning:
        sourceError?.code === "PGRST205"
          ? "Content run tables are not applied in Supabase yet."
          : sourceError?.message ?? "Could not persist content source.",
    };
  }

  const { data: runRow, error: runError } = await supabase
    .from("content_runs")
    .insert({
      user_id: userId,
      source_id: sourceRow.id,
      stack_id: stackId,
      job_id: jobId,
      name: run.run_name,
      status: "drafted",
      target_days: 30,
      starts_on: startsOn.toISOString().slice(0, 10),
      summary: run.summary,
    })
    .select("id")
    .single();

  if (runError || !runRow) {
    return {
      ok: false,
      runId: null,
      sourceId: sourceRow.id,
      pieceIds: pieces.map(() => null),
      warning: runError?.message ?? "Could not persist content run.",
    };
  }

  const { data: destinations } = await supabase
    .from("platform_destinations")
    .select("id, platform, label, is_default")
    .eq("user_id", userId);
  const { data: platformSettings } = await supabase
    .from("platform_settings")
    .select("platform, mode, is_enabled")
    .eq("user_id", userId);
  const destinationByPlatform = chooseDestinationByPlatform(
    (destinations ?? []) as DestinationChoice[],
    [source, run.run_name, run.summary].join("\n")
  );
  const platformModeByPlatform = buildPlatformModeMap(
    (platformSettings ?? []) as PlatformSetting[]
  );

  const rows = pieces.map((piece, index) => {
    const behavior = behaviorForPlatform(
      platformModeByPlatform.get(piece.platform),
      piece.validation.ok,
      piece
    );

    return {
      user_id: userId,
      run_id: runRow.id,
      source_id: sourceRow.id,
      destination_id: destinationByPlatform.get(piece.platform) ?? null,
      platform: piece.platform,
      level: piece.level,
      format: piece.format,
      title: piece.title,
      hook: piece.hook ?? null,
      body: piece.body,
      cta: piece.cta ?? null,
      slides: piece.slides ?? [],
      status: behavior.status,
      mode: behavior.mode,
      scheduled_for: piece.scheduled_for,
      validation: piece.validation,
      metadata: {
        scheduled_day: piece.scheduled_day ?? null,
        approvalCadence,
        postingTimes,
        timezoneOffsetMinutes,
        mediaType: piece.media_type ?? "image",
        visualPrompt: piece.visual_prompt ?? null,
        platformMode: behavior.platformMode,
      },
      position: index,
    };
  });

  const { data: pieceRows, error: piecesError } = await supabase
    .from("content_pieces")
    .insert(rows)
    .select("id, position")
    .order("position", { ascending: true });

  if (piecesError || !pieceRows) {
    return {
      ok: false,
      runId: runRow.id,
      sourceId: sourceRow.id,
      pieceIds: pieces.map(() => null),
      warning: piecesError?.message ?? "Could not persist content pieces.",
    };
  }

  const relay = await createRelayPostsForContentPieces({
    supabase,
    userId,
    runId: runRow.id,
    pieces,
    pieceRows: pieceRows as { id: string; position: number }[],
    destinationByPlatform,
    platformModeByPlatform,
  });

  return {
    ok: true,
    runId: runRow.id,
    sourceId: sourceRow.id,
    pieceIds: pieceRows.map((piece) => piece.id as string),
    warning: relay.ok ? undefined : `Run saved, but Relay sync failed: ${relay.error}`,
  };
}

type DestinationChoice = {
  id: string;
  platform: string;
  label: string | null;
  is_default: boolean | null;
};

type PlatformSetting = {
  platform: string;
  mode: "approval" | "autopilot" | "paused";
  is_enabled: boolean | null;
};

type PlatformBehavior = {
  status: "draft" | "approved";
  mode: "approval" | "autopilot";
  platformMode: "approval" | "autopilot" | "paused";
};

function buildPlatformModeMap(settings: PlatformSetting[]) {
  const result = new Map<string, PlatformSetting["mode"]>();
  for (const setting of settings) {
    result.set(
      setting.platform,
      setting.is_enabled === false ? "paused" : setting.mode
    );
  }
  return result;
}

function behaviorForPlatform(
  mode: PlatformSetting["mode"] | undefined,
  validationOk: boolean,
  piece: { platform: string; format?: string; media_type?: string }
): PlatformBehavior {
  const platformMode = mode ?? "approval";
  if (platformMode === "autopilot" && validationOk && isAutopilotEligible(piece)) {
    return { status: "approved", mode: "autopilot", platformMode };
  }
  return { status: "draft", mode: "approval", platformMode };
}

function isAutopilotEligible(piece: {
  platform: string;
  format?: string;
  media_type?: string;
}) {
  return (
    isPublishSupported(piece) &&
    hasRequiredMedia({
      platform: piece.platform,
      format: piece.format,
      metadata: { mediaType: piece.media_type ?? "image" },
    })
  );
}

function chooseDestinationByPlatform(
  destinations: DestinationChoice[],
  content: string
) {
  const result = new Map<string, string>();
  const normalizedContent = normalizeMatchText(content);
  const platforms = new Set(destinations.map((destination) => destination.platform));

  for (const platform of platforms) {
    const candidates = destinations.filter((destination) => destination.platform === platform);
    const labelMatch = candidates.find((destination) =>
      destinationMatchesContent(destination, normalizedContent)
    );
    const fallback = candidates.find((destination) => destination.is_default) ?? candidates[0];
    const chosen = labelMatch ?? fallback;
    if (chosen) result.set(platform, chosen.id);
  }

  return result;
}

function destinationMatchesContent(
  destination: DestinationChoice,
  normalizedContent: string
) {
  const label = normalizeMatchText(destination.label ?? "");
  const meaningfulWords = label
    .split(" ")
    .filter((word) => word.length >= 4 && word !== "irie");

  return meaningfulWords.some((word) => normalizedContent.includes(word));
}

function normalizeMatchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeApprovalCadence(value: string | undefined): ApprovalCadence {
  return APPROVAL_CADENCES.includes(value as ApprovalCadence)
    ? (value as ApprovalCadence)
    : "monthly";
}

function normalizePostingTimes(value: string[] | undefined): string[] {
  const valid = (value ?? [])
    .map((time) => time.trim())
    .filter((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time));

  return valid.length ? Array.from(new Set(valid)).slice(0, 8) : DEFAULT_POSTING_TIMES;
}
