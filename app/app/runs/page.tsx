import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";

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
    input_metadata: { url?: string; title?: string; length?: number } | null;
  } | null;
};

type PieceRow = {
  id: string;
  run_id: string;
  platform: string;
  title: string;
  body: string;
  status: string;
  scheduled_for: string | null;
  posted_url: string | null;
  metadata: {
    mediaType?: string | null;
    mediaAsset?: { url?: string | null } | null;
  } | null;
};

export default async function RunsPage() {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const { data: runs, error } = await supabase
    .from("content_runs")
    .select(
      "id, name, summary, status, target_days, starts_on, created_at, content_sources(type, input_metadata)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const typedRuns = (runs ?? []) as unknown as RunRow[];
  const activeRun = typedRuns[0] ?? null;

  const { data: pieces } = activeRun
    ? await supabase
        .from("content_pieces")
        .select("id, run_id, platform, title, body, status, scheduled_for, posted_url, metadata")
        .eq("run_id", activeRun.id)
        .eq("user_id", user.id)
        .order("scheduled_for", { ascending: true })
    : { data: null };

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">Plans</p>
          <h1 className="workspace-title">Your 30-day posting calendar.</h1>
          <p className="workspace-copy">
            See the month by day: platform, time, status, and what needs attention.
          </p>
        </div>
        <Link
          href="/app/generate"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light"
        >
          Create Posts
        </Link>
      </header>

      <div>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-bg-elevated p-4 text-sm text-destructive">
            Could not load plans.
          </p>
        ) : !activeRun ? (
          <EmptyCalendar />
        ) : (
          <div className="space-y-5">
            <ActivePlanCalendar run={activeRun} pieces={(pieces ?? []) as PieceRow[]} />
            {typedRuns.length > 1 && <OlderPlans runs={typedRuns.slice(1)} />}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCalendar() {
  const days = buildCalendarDays(new Date().toISOString().slice(0, 10), 30);

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-bg-surface p-4 shadow-card">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-text-muted">
            No plan built yet
          </p>
          <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight text-text-primary">
            Your next 30 days will show here.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Once you create a posting plan, every approved, scheduled, and posted
            piece will land on the day it belongs to.
          </p>
        </div>
        <Link
          href="/app/generate"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent/80"
        >
          Create Posts
        </Link>
      </header>

      <div className="mt-5 md:hidden">
        <div className="space-y-3">
          {days.map((day) => (
            <article
              key={day.key}
              className="rounded-md border border-border bg-bg-surface p-4 shadow-card"
            >
              <header className="mb-3 flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">
                    Day {day.dayNumber}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-text-primary">
                    {day.label}
                  </div>
                </div>
              </header>
              <p className="text-sm text-text-muted">Posts will appear here.</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto pb-3 md:block">
        <div className="grid min-w-[980px] grid-cols-7 gap-2">
          {days.map((day) => (
            <article
              key={day.key}
              className="min-h-[128px] rounded-md border border-border bg-bg-surface p-3 shadow-card"
            >
              <header className="mb-3 flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">
                    Day {day.dayNumber}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-text-primary">
                    {day.label}
                  </div>
                </div>
              </header>
              <p className="pt-3 text-xs text-text-muted">Posts will appear here.</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivePlanCalendar({ run, pieces }: { run: RunRow; pieces: PieceRow[] }) {
  const days = buildDays(run);
  const piecesByDate = groupPiecesByDate(pieces);
  const needsImages = pieces.filter(needsImage).length;
  const readyToApprove = pieces.filter(
    (piece) =>
      (piece.status === "draft" || piece.status === "pending_approval") &&
      !needsImage(piece)
  ).length;
  const sourceMeta = run.content_sources?.input_metadata;
  const sourceLabel =
    run.content_sources?.type === "url"
      ? sourceMeta?.title ?? sourceMeta?.url ?? "URL source"
      : "Pasted source";

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-bg-surface p-4 shadow-card">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-text-muted">
            Current plan · {sourceLabel}
          </p>
          <Link
            href={`/app/runs/${run.id}`}
            className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight text-text-primary underline decoration-border-strong underline-offset-4"
          >
            {run.name}
          </Link>
          {run.summary && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
              {run.summary}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 text-xs uppercase tracking-wider text-text-muted sm:justify-end">
          <div>{pretty(run.status)}</div>
          <div>{pieces.length} posts</div>
          <div>{readyToApprove} ready</div>
          <div>{needsImages} need images</div>
          <Link
            href={`/app/runs/${run.id}`}
            className="inline-flex min-h-10 items-center rounded-md bg-accent px-3 text-sm normal-case tracking-normal text-text-primary hover:bg-accent/80"
          >
            Review plan
          </Link>
        </div>
      </header>

      <div className="mt-5 md:hidden">
        <MobileAgenda days={days} piecesByDate={piecesByDate} runId={run.id} />
      </div>

      <div className="mt-4 hidden overflow-x-auto pb-3 md:block">
        <div className="grid min-w-[980px] grid-cols-7 gap-2">
          {days.map((day) => (
            <DayCell
              key={day.key}
              day={day}
              pieces={piecesByDate.get(day.key) ?? []}
              runId={run.id}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
        <Legend label="Draft" className="bg-bg-elevated" />
        <Legend label="Approved" className="bg-success/10 text-success" />
        <Legend label="Posted" className="bg-accent/20 text-text-primary" />
        <Legend label="Failed" className="bg-destructive/10 text-destructive" />
      </div>
    </section>
  );
}

function DayCell({
  day,
  pieces,
  runId,
}: {
  day: { key: string; dayNumber: number; label: string };
  pieces: PieceRow[];
  runId: string;
}) {
  return (
    <article className="min-h-[132px] rounded-md border border-border bg-bg-surface p-3 shadow-card">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Day {day.dayNumber}
          </div>
          <div className="mt-0.5 text-sm font-medium text-text-primary">{day.label}</div>
        </div>
        <div className="text-xs text-text-muted">{pieces.length}</div>
      </header>

      <div className="space-y-1.5">
        {pieces.slice(0, 4).map((piece) => (
          <Link
            key={piece.id}
            href={`/app/runs/${runId}#post-${piece.id}`}
            title={`${pretty(piece.platform)} · ${pretty(piece.status)} · ${formatTime(
              piece.scheduled_for
            )}\n${piece.title}\n\n${piece.body}`}
            className={`block max-h-10 overflow-hidden rounded-md border px-2 py-1 text-xs leading-tight transition-colors hover:bg-bg-hover ${statusClass(
              piece.status
            )}`}
          >
            <span className="font-semibold">{pretty(piece.platform)}</span>
            <span className="mx-1 text-text-muted">·</span>
            <span className="text-text-muted">{formatTime(piece.scheduled_for)}</span>
            <span className="mx-1 text-text-muted">·</span>
            <span>{piece.title}</span>
          </Link>
        ))}
        {pieces.length > 4 && (
          <Link
            href={`/app/runs/${runId}#day-${day.key.replace(/[^a-zA-Z0-9-]/g, "-")}`}
            className="block rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
          >
            +{pieces.length - 4} more
          </Link>
        )}
        {pieces.length === 0 && (
          <p className="pt-3 text-xs text-text-muted">No posts planned.</p>
        )}
      </div>
    </article>
  );
}

function MobileAgenda({
  days,
  piecesByDate,
  runId,
}: {
  days: { key: string; dayNumber: number; label: string }[];
  piecesByDate: Map<string, PieceRow[]>;
  runId: string;
}) {
  return (
    <div className="space-y-3">
      {days.map((day) => {
        const pieces = piecesByDate.get(day.key) ?? [];
        return (
          <article
            key={day.key}
            className="rounded-md border border-border bg-bg-surface p-4 shadow-card"
          >
            <header className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  Day {day.dayNumber}
                </div>
                <h3 className="mt-0.5 text-base font-semibold text-text-primary">
                  {day.label}
                </h3>
              </div>
              <Link
                href={`/app/runs/${runId}#day-${day.key.replace(/[^a-zA-Z0-9-]/g, "-")}`}
                className="text-sm text-accent-deep underline underline-offset-2"
              >
                Open
              </Link>
            </header>
            <div className="space-y-2">
              {pieces.map((piece) => (
                <Link
                  key={piece.id}
                  href={`/app/runs/${runId}#post-${piece.id}`}
                  className="block rounded-md border border-border bg-bg-elevated p-3 text-sm"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-text-muted">
                    <span>{pretty(piece.platform)}</span>
                    <span>{formatTime(piece.scheduled_for)}</span>
                    <span>{operatorStatus(piece)}</span>
                  </div>
                  <div className="font-medium text-text-primary">{piece.title}</div>
                </Link>
              ))}
              {pieces.length === 0 && (
                <p className="text-sm text-text-muted">No posts planned.</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OlderPlans({ runs }: { runs: RunRow[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
        Older plans
      </h2>
      <div className="space-y-3">
        {runs.map((run) => (
          <Link
            key={run.id}
            href={`/app/runs/${run.id}`}
            className="block rounded-md border border-border bg-bg-surface p-4 shadow-card transition-colors hover:bg-bg-hover"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{run.name}</h3>
                {run.summary && (
                  <p className="mt-1 max-w-2xl text-sm text-text-secondary">{run.summary}</p>
                )}
              </div>
              <div className="text-xs uppercase tracking-wider text-text-muted">
                {new Date(run.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function buildDays(run: RunRow) {
  const count = Math.max(1, Math.min(30, run.target_days || 30));
  return buildCalendarDays(run.starts_on, count);
}

function buildCalendarDays(startsOn: string, count: number) {
  const start = new Date(`${startsOn}T00:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      dayNumber: index + 1,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
}

function groupPiecesByDate(pieces: PieceRow[]) {
  const map = new Map<string, PieceRow[]>();
  for (const piece of pieces) {
    if (!piece.scheduled_for) continue;
    const key = new Date(piece.scheduled_for).toISOString().slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), piece]);
  }
  return map;
}

function Legend({ label, className }: { label: string; className: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-sm border border-border ${className}`} />
      {label}
    </span>
  );
}

function statusClass(status: string) {
  if (status === "posted") return "border-accent bg-accent/20 text-text-primary";
  if (status === "approved") return "border-success/30 bg-success/10 text-text-primary";
  if (status === "failed") return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-border bg-bg-elevated text-text-primary";
}

function needsImage(piece: PieceRow) {
  const mediaType = piece.metadata?.mediaType;
  return Boolean(mediaType && mediaType !== "none" && !piece.metadata?.mediaAsset?.url);
}

function operatorStatus(piece: PieceRow) {
  if (piece.status === "posted") return "Posted";
  if (piece.status === "approved") return "Ready";
  if (piece.status === "failed") return "Issue";
  if (needsImage(piece)) return "Needs image";
  if (piece.status === "pending_approval") return "Needs review";
  return "Draft";
}

function pretty(value: string) {
  return value
    .replace(/^x$/, "X")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string | null) {
  if (!value) return "No time";
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
