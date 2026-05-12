import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { PublishButton } from "../../queue/publish-button";
import { SaveRunMemoryButton } from "../../save-run-memory-button";
import { MediaUploadButton } from "../../media-upload-button";
import { ApproveButton } from "../../approve-button";

type RunRow = {
  id: string;
  name: string;
  summary: string | null;
  status: string;
  target_days: number;
  starts_on: string;
  created_at: string;
  content_sources: {
    type: string;
    input_text: string;
    input_metadata: { url?: string; title?: string; length?: number } | null;
  } | null;
};

type PieceRow = {
  id: string;
  platform: string;
  level: string;
  format: string;
  title: string;
  body: string;
  status: string;
  approval_status: string | null;
  scheduled_for: string | null;
  posted_url: string | null;
  slides: { text?: string; image_prompt?: string }[] | null;
  metadata: {
    mediaType?: string;
    visualPrompt?: string | null;
    mediaAsset?: { url?: string | null } | null;
  } | null;
  validation: {
    ok?: boolean;
    actualChars?: number;
    maxChars?: number | null;
    qualityScore?: number;
  } | null;
};

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const { id } = await params;
  const { data: run } = await supabase
    .from("content_runs")
    .select(
      "id, name, summary, status, target_days, starts_on, created_at, content_sources(type, input_text, input_metadata)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run) notFound();

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select(
      "id, platform, level, format, title, body, status, approval_status, scheduled_for, posted_url, slides, metadata, validation"
    )
    .eq("run_id", id)
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  const typedRun = run as unknown as RunRow;
  const typedPieces = (pieces ?? []) as PieceRow[];
  const flagged = typedPieces.filter((piece) => piece.validation?.ok === false).length;
  const posted = typedPieces.filter((piece) => piece.status === "posted").length;
  const needsImages = typedPieces.filter(needsImage).length;
  const ready = typedPieces.filter((piece) => canApprove(piece)).length;
  const needsAttention = typedPieces.filter(needsOperatorAttention).slice(0, 8);
  const piecesByDay = groupPiecesByDate(typedPieces);

  return (
    <div className="max-w-5xl">
      <Link
        href="/app/runs"
        className="mb-6 inline-block text-sm text-text-secondary underline underline-offset-2 hover:text-text-primary"
      >
        Back to plan calendar
      </Link>

      <header className="border-y border-border-subtle py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
              Plan Review
            </p>
            <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
              {typedRun.name}
            </h1>
            {typedRun.summary && (
              <p className="mt-4 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
                {typedRun.summary}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Metric label="Pieces" value={typedPieces.length.toString()} />
            <Metric label="Ready" value={ready.toString()} />
            <Metric label="Posted" value={posted.toString()} />
            <Metric label="Images" value={needsImages.toString()} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ApproveButton scope={{ runId: typedRun.id }}>Approve ready posts</ApproveButton>
          <Link
            href="/app/relay?status=approved"
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg-hover"
          >
            Open delivery queue
          </Link>
          <SaveRunMemoryButton runId={typedRun.id} />
        </div>
        {(flagged > 0 || needsImages > 0) && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {needsImages > 0
              ? `${needsImages} posts still need images before approval. `
              : ""}
            {flagged > 0 ? `${flagged} posts need fixes before approval.` : ""}
          </p>
        )}
      </header>

      {needsAttention.length > 0 && (
        <section className="mt-6 rounded-md bg-bg-surface p-4 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="workspace-kicker">Needs attention</p>
              <h2 className="mt-1 text-lg font-semibold text-text-primary">
                Start with these posts.
              </h2>
            </div>
            <Link
              href="/app/queue"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-bg-elevated px-4 text-sm font-medium text-text-primary hover:bg-bg-hover"
            >
              Open Review Inbox
            </Link>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {needsAttention.map((piece) => (
              <a
                key={piece.id}
                href={`#post-${piece.id}`}
                className="rounded-md border border-border-subtle bg-bg-elevated p-3 text-sm transition-colors hover:bg-bg-hover"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-text-muted">
                  <span>{pretty(piece.platform)}</span>
                  <span>{operatorStatus(piece)}</span>
                  <span>{piece.scheduled_for ? formatTime(piece.scheduled_for) : "Unscheduled"}</span>
                </div>
                <div className="font-medium text-text-primary">{piece.title}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {typedRun.content_sources && (
        <section className="mt-6 rounded-md bg-bg-surface shadow-card">
          <details>
            <summary className="cursor-pointer list-none p-5 marker:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wider text-text-muted">
                    Source · {typedRun.content_sources.type}
                  </div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Original source material
                  </h2>
                </div>
                <span className="text-sm text-accent-deep">Open</span>
              </div>
            </summary>
            <div className="border-t border-border-subtle px-5 pb-5 pt-4">
              {typedRun.content_sources.input_metadata?.url && (
                <a
                  href={typedRun.content_sources.input_metadata.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 inline-block text-sm text-accent-deep underline underline-offset-2"
                >
                  {typedRun.content_sources.input_metadata.title ??
                    typedRun.content_sources.input_metadata.url}
                </a>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {typedRun.content_sources.input_text}
              </p>
            </div>
          </details>
        </section>
      )}

      <section className="mt-8 space-y-5">
        {piecesByDay.map(([day, pieces], index) => (
          <DaySection
            key={day}
            day={day}
            dayNumber={index + 1}
            pieces={pieces}
            runId={typedRun.id}
          />
        ))}
      </section>
    </div>
  );
}

function DaySection({
  day,
  dayNumber,
  pieces,
  runId,
}: {
  day: string;
  dayNumber: number;
  pieces: PieceRow[];
  runId: string;
}) {
  const ready = pieces.filter((piece) => canApprove(piece)).length;
  const images = pieces.filter(needsImage).length;
  const issues = pieces.filter((piece) => piece.validation?.ok === false).length;
  const openByDefault = ready > 0 || images > 0 || issues > 0 || dayNumber === 1;
  const anchor = `day-${day.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  return (
    <section id={anchor} className="rounded-md bg-bg-primary shadow-card">
      <details open={openByDefault}>
        <summary className="cursor-pointer list-none p-4 marker:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">
                Day {dayNumber}
              </div>
              <h2 className="font-display text-xl text-text-primary">
                {formatDay(day)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
              <span>{pieces.length} posts</span>
              <span>{ready} ready</span>
              <span>{images} images</span>
              {issues > 0 && <span>{issues} issues</span>}
            </div>
          </div>
        </summary>
        <div className="border-t border-border-subtle p-3 sm:p-4">
          {ready > 0 && (
            <div className="mb-3">
              <ApproveButton scope={{ runId, day }} variant="secondary">
                Approve this day
              </ApproveButton>
            </div>
          )}
          <div className="space-y-3">
            {pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}

function PieceCard({ piece }: { piece: PieceRow }) {
  const canPost =
    piece.status === "approved" &&
    piece.format !== "thread" &&
    piece.validation?.ok !== false;

  const openByDefault = needsOperatorAttention(piece);

  return (
    <article id={`post-${piece.id}`} className="scroll-mt-24 rounded-md bg-bg-surface shadow-card">
      <details open={openByDefault}>
        <summary className="cursor-pointer list-none p-4 marker:hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted">
                <span>{pretty(piece.platform)}</span>
                <span>{pretty(piece.level)}</span>
                <span>{pretty(piece.format)}</span>
                <span>{operatorStatus(piece)}</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                {piece.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                {piece.body}
              </p>
            </div>
            <div className="text-right text-xs uppercase tracking-wider text-text-muted">
              <div>{piece.scheduled_for ? formatTime(piece.scheduled_for) : "Unscheduled"}</div>
              <div className="mt-1">
                {charLabel(piece.validation, piece.body)}
                {typeof piece.validation?.qualityScore === "number"
                  ? ` · Q${piece.validation.qualityScore}`
                  : ""}
              </div>
            </div>
          </div>
        </summary>
        <div className="border-t border-border-subtle p-4">
          <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-text-primary">
            {piece.body}
          </p>
          {piece.metadata?.visualPrompt && piece.metadata.mediaType !== "none" && (
            <VisualBrief
              pieceId={piece.id}
              mediaType={piece.metadata.mediaType ?? "image"}
              prompt={piece.metadata.visualPrompt}
              imageUrl={piece.metadata.mediaAsset?.url}
            />
          )}
          {piece.slides && piece.slides.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {piece.slides.map((slide, index) => (
                <div
                  key={`${piece.id}-slide-${index}`}
                  className="rounded-md border border-border-subtle bg-bg-elevated p-3"
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">
                    Slide {index + 1}
                  </div>
                  {slide.text && (
                    <p className="text-sm leading-relaxed text-text-primary">
                      {slide.text}
                    </p>
                  )}
                  {slide.image_prompt && (
                    <p className="mt-2 border-t border-border-subtle pt-2 text-xs leading-relaxed text-text-secondary">
                      {slide.image_prompt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <footer className="mt-5 flex flex-wrap items-center gap-3">
            {canApprove(piece) && (
              <ApproveButton scope={{ pieceId: piece.id }} variant="secondary">
                Approve post
              </ApproveButton>
            )}
            {canPost && <PublishButton pieceId={piece.id} />}
            {piece.posted_url && (
              <a
                href={piece.posted_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent-deep underline underline-offset-2"
              >
                View posted update
              </a>
            )}
          </footer>
        </div>
      </details>
    </article>
  );
}

function VisualBrief({
  pieceId,
  mediaType,
  prompt,
  imageUrl,
}: {
  pieceId: string;
  mediaType: string;
  prompt: string;
  imageUrl?: string | null;
}) {
  return (
    <div className="mt-4 rounded-md border border-border-subtle bg-bg-elevated p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
          Visual Brief
        </span>
        <span className="rounded-sm bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
          {pretty(mediaType)}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{prompt}</p>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        Upload one finished JPG or PNG. Square or portrait works best. Once it is
        uploaded, this post can move forward.
      </p>
      <MediaUploadButton pieceId={pieceId} initialUrl={imageUrl} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 rounded-md border border-border bg-bg-surface px-3 py-2 shadow-card">
      <div className="font-display text-xl leading-none text-text-primary">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
    </div>
  );
}

function canApprove(piece: PieceRow) {
  return (
    (piece.status === "draft" || piece.status === "pending_approval") &&
    piece.validation?.ok !== false &&
    !needsImage(piece)
  );
}

function needsImage(piece: PieceRow) {
  const mediaType = piece.metadata?.mediaType;
  return Boolean(mediaType && mediaType !== "none" && !piece.metadata?.mediaAsset?.url);
}

function needsOperatorAttention(piece: PieceRow) {
  return needsImage(piece) || canApprove(piece) || piece.validation?.ok === false;
}

function groupPiecesByDate(pieces: PieceRow[]) {
  const map = new Map<string, PieceRow[]>();
  for (const piece of pieces) {
    const key = piece.scheduled_for
      ? new Date(piece.scheduled_for).toISOString().slice(0, 10)
      : "Unscheduled";
    map.set(key, [...(map.get(key) ?? []), piece]);
  }
  return [...map.entries()];
}

function formatDay(day: string) {
  if (day === "Unscheduled") return day;
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function charLabel(validation: PieceRow["validation"], body: string) {
  const actual = validation?.actualChars ?? body.length;
  const max = validation?.maxChars;
  if (!max || max > 5000) return `${actual} chars`;
  return `${actual}/${max} chars`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function operatorStatus(piece: PieceRow) {
  if (needsImage(piece)) return "Needs image";
  if (piece.validation?.ok === false) return "Needs fix";
  if (canApprove(piece)) return "Ready";
  if (piece.status === "approved") return "Approved";
  if (piece.status === "posted") return "Posted";
  return pretty(piece.status);
}

function pretty(value: string) {
  return value
    .replace(/^x$/, "X")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
