import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { MediaUploadButton } from "../media-upload-button";
import { PublishButton } from "./publish-button";
import { ApproveButton } from "../approve-button";

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
  content_runs: { name: string } | null;
  destination: { label: string; external_id: string | null } | null;
};

const STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "posted",
  "failed",
  "rejected",
] as const;

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const params = await searchParams;
  const status: (typeof STATUSES)[number] = STATUSES.includes(
    params.status as (typeof STATUSES)[number]
  )
    ? (params.status as (typeof STATUSES)[number])
    : "draft";

  const { data: pieces, error } = await supabase
    .from("content_pieces")
    .select(
      "id, platform, level, format, title, body, status, approval_status, scheduled_for, posted_url, metadata, validation, content_runs(name), destination:platform_destinations(label, external_id)"
    )
    .eq("user_id", user.id)
    .eq("status", status)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">Approvals</p>
          <h1 className="workspace-title">Clear the review pile.</h1>
          <p className="workspace-copy">
            Open the next post, add the missing image if it needs one, then approve
            the pieces that are ready to go.
          </p>
        </div>
      </header>

      {error ? (
        <p className="mt-8 rounded-md border border-destructive/30 bg-bg-elevated p-4 text-sm text-destructive">
          Could not load approvals.
        </p>
      ) : (
        <div className="space-y-3">
          <NextActionPanel pieces={(pieces ?? []) as unknown as PieceRow[]} status={status} />
          <StatusNav status={status} />
          <ReviewPlaylist pieces={(pieces ?? []) as unknown as PieceRow[]} />
          <div className="grid gap-3">
            {((pieces ?? []) as unknown as PieceRow[]).map((piece, index) => (
              <QueuePiece key={piece.id} piece={piece} index={index} />
            ))}
          </div>
          {(!pieces || pieces.length === 0) && (
            <div className="rounded-md border border-border bg-bg-surface p-6 text-sm text-text-secondary shadow-card">
              No posts in this bucket. Create a plan first, then IrieStack will
              bring the next review items here.
              <div className="mt-4">
                <Link
                  href="/app/research"
                  className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary"
                >
                  Build content fuel
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusNav({ status }: { status: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {STATUSES.map((item) => (
        <Link
          key={item}
          href={`/app/queue?status=${item}`}
          className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
            item === status
              ? "border-accent bg-accent text-text-primary"
              : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover"
          }`}
        >
          {statusLabel(item)}
        </Link>
      ))}
    </nav>
  );
}

function ReviewPlaylist({ pieces }: { pieces: PieceRow[] }) {
  if (pieces.length === 0) return null;

  return (
    <section className="rounded-md border border-border bg-bg-surface p-3 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="workspace-kicker mb-1">Up next</p>
          <h2 className="text-sm font-semibold text-text-primary">
            Work through the next few posts.
          </h2>
        </div>
        <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
          {pieces.length} in this view
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {pieces.slice(0, 5).map((piece) => (
          <Link
            key={piece.id}
            href={`#post-${piece.id}`}
            className="group min-w-0 rounded-md border border-border bg-bg-elevated p-3 transition-colors hover:border-border-strong hover:bg-bg-hover"
          >
            <div className="mb-2 flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-wider text-text-muted">
              <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(piece)}`} />
              <span className="shrink-0 font-semibold text-text-primary">
                {compactPlatform(piece.platform)}
              </span>
              <span className="truncate">{operatorStatus(piece)}</span>
            </div>
            <p className="truncate text-sm font-medium text-text-primary">
              {piece.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NextActionPanel({ pieces, status }: { pieces: PieceRow[]; status: string }) {
  const imageItem = pieces.find(needsImage);
  const readyItem = pieces.find(
    (piece) =>
      (piece.status === "draft" || piece.status === "pending_approval") &&
      piece.validation?.ok !== false &&
      !needsImage(piece)
  );
  const issueItem = pieces.find((piece) => piece.validation?.ok === false || piece.status === "failed");
  const target = imageItem ?? readyItem ?? issueItem ?? pieces[0];

  if (!target) return null;

  return (
    <section className="rounded-md border border-border bg-bg-surface p-4 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="workspace-kicker">5-minute review sprint</p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-text-primary">
            {nextActionTitle(target, status)}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            {target.title} · {pretty(target.platform)} ·{" "}
            {target.scheduled_for ? new Date(target.scheduled_for).toLocaleDateString() : "Unscheduled"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <ReviewStat label="In this view" value={pieces.length.toString()} />
            <ReviewStat label="Need images" value={pieces.filter(needsImage).length.toString()} />
            <ReviewStat
              label="Ready now"
              value={pieces
                .filter((piece) => piece.validation?.ok !== false && !needsImage(piece))
                .length.toString()}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {needsImage(target) ? (
            <Link
              href={`#post-${target.id}`}
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary"
            >
              Add image
            </Link>
          ) : readyItem?.id === target.id ? (
            <ApproveButton scope={{ pieceId: target.id }}>
              Approve & schedule
            </ApproveButton>
          ) : (
            <Link
              href={`#post-${target.id}`}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-bg-elevated px-4 text-sm font-medium text-text-primary"
            >
              Review details
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-3 text-text-secondary">
      <strong className="text-text-primary">{value}</strong>
      {label}
    </span>
  );
}

function QueuePiece({ piece, index }: { piece: PieceRow; index: number }) {
  const canPost =
    piece.status === "approved" &&
    piece.format !== "thread" &&
    piece.validation?.ok !== false;
  const canApprove =
    (piece.status === "draft" || piece.status === "pending_approval") &&
    piece.validation?.ok !== false &&
    !needsImage(piece);

  return (
    <article
      id={`post-${piece.id}`}
      className="scroll-mt-4 overflow-hidden rounded-md border border-border bg-bg-surface shadow-card"
    >
      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 p-4">
          <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-text-muted">
                <span className="inline-flex min-h-7 items-center rounded-full bg-text-primary px-2.5 font-semibold text-bg-surface">
                  {compactPlatform(piece.platform)}
                </span>
                <span>{pretty(piece.platform)}</span>
                <span>{pretty(piece.level)}</span>
                <span>{pretty(piece.format)}</span>
                {piece.destination?.label && <span>To {piece.destination.label}</span>}
              </div>
              <h2 className="truncate text-base font-semibold text-text-primary">
                {piece.title}
              </h2>
              <p className="mt-1 truncate text-xs text-text-muted">
                {piece.content_runs?.name ?? "Untitled run"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary">
              <span className={`h-2 w-2 rounded-full ${statusDotClass(piece)}`} />
              {operatorStatus(piece)}
            </div>
          </header>

          <div className="rounded-md border border-border-subtle bg-bg-primary shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-deep">
                  {compactPlatform(piece.platform)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Post {index + 1}
                  </p>
                  <p className="text-xs text-text-muted">
                    {piece.scheduled_for ? shortDateTime(piece.scheduled_for) : "Unscheduled"}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary">
                {charLabel(piece.validation, piece.body)}
                {typeof piece.validation?.qualityScore === "number"
                  ? ` · Q${piece.validation.qualityScore}`
                  : ""}
              </span>
            </div>
            <div className="max-h-[260px] overflow-y-auto px-4 py-4">
              <p className="whitespace-pre-wrap text-[15px] leading-[1.55] text-text-primary">
                {piece.body}
              </p>
            </div>
          </div>
        </div>

        <aside className="border-t border-border-subtle bg-bg-elevated p-4 xl:border-l xl:border-t-0">
          {piece.metadata?.visualPrompt && piece.metadata.mediaType !== "none" && (
            <VisualBrief
              pieceId={piece.id}
              mediaType={piece.metadata.mediaType ?? "image"}
              prompt={piece.metadata.visualPrompt}
              imageUrl={piece.metadata.mediaAsset?.url}
            />
          )}

          <div className="mt-3 rounded-md border border-border-subtle bg-bg-surface p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Next action
            </p>
            {canApprove && (
              <ApproveButton scope={{ pieceId: piece.id }}>
                Approve & schedule
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
            {!canApprove && !canPost && !piece.posted_url && (
              <span className="block text-sm leading-relaxed text-text-secondary">
                {needsImage(piece)
                  ? "Upload image to unlock approval."
                  : "Already handled. Move to the next post."}
              </span>
            )}
          </div>
        </aside>
      </div>
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
    <div className="rounded-md border border-border-subtle bg-bg-surface p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
          Image direction
        </span>
        <span className="rounded-sm bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
          {pretty(mediaType)}
        </span>
      </div>
      <p className="max-h-32 overflow-y-auto text-sm leading-relaxed text-text-secondary">
        {prompt}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        Drop in the image for this post. Square or portrait works best.
      </p>
      <MediaUploadButton pieceId={pieceId} initialUrl={imageUrl} />
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
  if (piece.status === "draft") return "Ready to review";
  if (piece.status === "pending_approval") return "Needs review";
  if (piece.status === "approved") return "Approved";
  if (piece.status === "posted") return "Posted";
  if (piece.status === "failed") return "Issue";
  return pretty(piece.status);
}

function statusDotClass(piece: PieceRow) {
  if (piece.status === "posted") return "bg-accent-deep";
  if (piece.status === "approved") return "bg-success";
  if (piece.status === "failed") return "bg-destructive";
  if (needsImage(piece)) return "bg-accent";
  return "bg-text-muted";
}

function compactPlatform(value: string) {
  if (value.toLowerCase() === "linkedin") return "In";
  if (value.toLowerCase() === "instagram") return "IG";
  if (value.toLowerCase() === "facebook") return "FB";
  if (value.toLowerCase() === "threads") return "Th";
  if (value.toLowerCase() === "tiktok") return "TT";
  return pretty(value);
}

function statusLabel(value: string) {
  if (value === "draft") return "To finish";
  if (value === "pending_approval") return "Ready";
  if (value === "approved") return "Scheduled";
  if (value === "posted") return "Live";
  if (value === "failed") return "Issues";
  if (value === "rejected") return "Skipped";
  return pretty(value);
}

function nextActionTitle(piece: PieceRow, status: string) {
  if (needsImage(piece)) return "Add one image and unlock the next post.";
  if (piece.validation?.ok === false) return "Fix this post before it moves forward.";
  if (status === "approved") return "This one is ready for delivery.";
  if (piece.status === "posted") return "This is already posted. Check the receipt.";
  return "Approve one clean post and keep the month moving.";
}

function charLabel(validation: PieceRow["validation"], body: string) {
  const actual = validation?.actualChars ?? body.length;
  const max = validation?.maxChars;
  if (!max || max > 5000) return `${actual} chars`;
  return `${actual}/${max} chars`;
}

function shortDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} · ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
