import Link from "next/link";
import { getAppContext } from "@/lib/app-auth";
import { SaveRunMemoryButton } from "./save-run-memory-button";

type RunRow = {
  id: string;
  name: string;
  summary: string | null;
  status: string;
  target_days: number;
  starts_on: string;
  created_at: string;
};

type PieceRow = {
  id: string;
  platform: string;
  format: string;
  status: string;
  approval_status: string | null;
  posted_url: string | null;
  scheduled_for: string | null;
  validation: { ok?: boolean } | null;
  metadata: {
    mediaType?: string | null;
    mediaAsset?: { url?: string | null } | null;
  } | null;
};

export default async function AppHome() {
  const { supabase, user } = await getAppContext();

  const runsQuery = supabase
    .from("content_runs")
    .select("id, name, summary, status, target_days, starts_on, created_at")
    .order("created_at", { ascending: false })
    .limit(3);
  if (user) runsQuery.eq("user_id", user.id);
  const { data: runs, error: runsError } = await runsQuery;

  const latestRun = (runs?.[0] as RunRow | undefined) ?? null;
  const { data: pieces } = latestRun
    ? await supabase
        .from("content_pieces")
        .select("id, platform, format, status, approval_status, posted_url, scheduled_for, validation, metadata")
        .eq("run_id", latestRun.id)
        .order("scheduled_for", { ascending: true })
        .limit(60)
    : { data: null };

  const tableMissing = runsError?.code === "PGRST205";

  return (
    <div className="max-w-5xl">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
        Home
      </p>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
        Turn one idea into posts for the month.
      </h1>
      <p className="mt-4 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
        Paste a thought, transcript, or article. IrieStack turns it into posts,
        puts them in a posting schedule, and keeps track of what is ready.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/app/generate"
          className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all duration-150 hover:bg-accent-light hover:shadow-card-hover"
        >
          Create posts
        </Link>
        <Link
          href="/app/stack"
          className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-bg-surface px-6 text-[15px] font-medium text-text-primary shadow-card transition-all duration-150 hover:bg-bg-hover"
        >
          Edit your voice
        </Link>
      </div>

      {tableMissing ? (
        <div className="mt-10 rounded-md border border-warning/30 bg-bg-elevated p-5 text-sm leading-relaxed text-text-secondary">
          The content run schema is in the repo, but it has not been applied to
          Supabase yet. Generation still works; persistence turns on as soon as
          the migration lands.
        </div>
      ) : latestRun ? (
        <LatestRun run={latestRun} pieces={(pieces ?? []) as PieceRow[]} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function LatestRun({ run, pieces }: { run: RunRow; pieces: PieceRow[] }) {
  const flagged = pieces.filter((piece) => piece.validation?.ok === false).length;
  const platforms = new Set(pieces.map((piece) => piece.platform)).size;
  const needsImages = pieces.filter(needsImage).length;
  const approved = pieces.filter((piece) => piece.status === "approved").length;

  return (
    <section className="mt-12 space-y-6">
      <header className="border-y border-border-subtle py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
              Latest Plan
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-text-primary">
              {run.name}
            </h2>
            {run.summary && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                {run.summary}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Metric label="Pieces" value={pieces.length.toString()} />
            <Metric label="Platforms" value={platforms.toString()} />
            <Metric label="Approved" value={approved.toString()} />
            <Metric label="Images" value={needsImages.toString()} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/app/runs/${run.id}`}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary hover:bg-accent/80"
          >
            Review this plan
          </Link>
          <Link
            href="/app/queue"
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg-hover"
          >
            Open approvals
          </Link>
          <SaveRunMemoryButton runId={run.id} />
        </div>
        {(flagged > 0 || needsImages > 0) && (
          <p className="mt-3 text-sm text-text-secondary">
            {needsImages > 0 ? `${needsImages} posts need images. ` : ""}
            {flagged > 0 ? `${flagged} posts need fixes.` : ""}
          </p>
        )}
      </header>

      <div className="space-y-3">
        {pieces.slice(0, 12).map((piece) => (
          <div
            key={piece.id}
            className="grid gap-3 rounded-md border border-border bg-bg-surface p-4 shadow-card sm:grid-cols-[1fr_auto_auto]"
          >
            <div>
              <div className="text-sm font-medium text-text-primary">
                {pretty(piece.platform)} · {pretty(piece.format)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {piece.scheduled_for
                  ? new Date(piece.scheduled_for).toLocaleString()
                  : "Unscheduled"}
              </div>
            </div>
            <div className="text-xs uppercase tracking-wider text-text-muted">
              {operatorStatus(piece)}
            </div>
            <div
              className={`text-xs ${
                piece.status === "posted"
                  ? "text-success"
                : piece.validation?.ok === false
                    ? "text-destructive"
                    : needsImage(piece)
                      ? "text-accent-deep"
                    : "text-success"
              }`}
            >
              {piece.status === "posted"
                ? "Posted"
                : piece.validation?.ok === false
                  ? "Needs revision"
                  : needsImage(piece)
                    ? "Needs image"
                    : "Ready"}
            </div>
          </div>
        ))}
        {pieces.length > 12 && (
          <Link
            href={`/app/runs/${run.id}`}
            className="block rounded-md border border-border bg-bg-surface p-4 text-sm font-medium text-accent-deep shadow-card underline underline-offset-2"
          >
            See all {pieces.length} posts
          </Link>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 grid gap-4 sm:grid-cols-3">
      <PlaceholderCard
        n="01"
        title="Add your idea"
        body="Use a post draft, transcript, article, or rough thought."
      />
      <PlaceholderCard
        n="02"
        title="Get the posts"
        body="The app drafts platform-ready posts from that one source."
      />
      <PlaceholderCard
        n="03"
        title="Approve or post"
        body="Ready posts move into the posting queue for each account."
      />
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

function PlaceholderCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md bg-bg-surface p-5 shadow-card">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 font-display text-sm text-accent-deep">
        {n}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
        {body}
      </p>
    </div>
  );
}

function pretty(value: string): string {
  return value
    .replace(/^x$/, "X")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function needsImage(piece: PieceRow) {
  const mediaType = piece.metadata?.mediaType;
  return Boolean(mediaType && mediaType !== "none" && !piece.metadata?.mediaAsset?.url);
}

function operatorStatus(piece: PieceRow) {
  if (needsImage(piece)) return "Needs image";
  if (piece.status === "draft") return "Draft";
  if (piece.status === "pending_approval") return "Needs review";
  if (piece.status === "approved") return "Approved";
  if (piece.status === "posted") return "Posted";
  if (piece.status === "failed") return "Issue";
  return pretty(piece.approval_status ?? piece.status);
}
