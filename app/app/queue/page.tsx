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
          {((pieces ?? []) as unknown as PieceRow[]).map((piece) => (
            <QueuePiece key={piece.id} piece={piece} />
          ))}
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

function QueuePiece({ piece }: { piece: PieceRow }) {
  const canPost =
    piece.status === "approved" &&
    piece.format !== "thread" &&
    piece.validation?.ok !== false;
  const canApprove =
    (piece.status === "draft" || piece.status === "pending_approval") &&
    piece.validation?.ok !== false &&
    !needsImage(piece);

  return (
    <article id={`post-${piece.id}`} className="rounded-md border border-border bg-bg-surface shadow-card">
      <header className="grid gap-3 border-b border-border-subtle p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted">
            <span className="rounded-full bg-bg-elevated px-2 py-1 font-semibold text-text-primary">
              {pretty(piece.platform)}
            </span>
            <span>{pretty(piece.level)}</span>
            <span>{pretty(piece.format)}</span>
            {piece.destination?.label && <span>To {piece.destination.label}</span>}
          </div>
          <h2 className="text-base font-semibold text-text-primary">{piece.title}</h2>
          <p className="mt-1 truncate text-xs text-text-muted">
            {piece.content_runs?.name ?? "Untitled run"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs lg:text-right">
          <div className="rounded-md bg-bg-elevated p-2">
            <p className="uppercase tracking-wider text-text-muted">Time</p>
            <p className="mt-1 text-text-primary">
              {piece.scheduled_for
                ? new Date(piece.scheduled_for).toLocaleString()
                : "Unscheduled"}
            </p>
          </div>
          <div className="rounded-md bg-bg-elevated p-2">
            <p className="uppercase tracking-wider text-text-muted">{operatorStatus(piece)}</p>
            <p className="mt-1 text-text-primary">
              {charLabel(piece.validation, piece.body)}
              {typeof piece.validation?.qualityScore === "number"
                ? ` · Q${piece.validation.qualityScore}`
                : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-border-subtle bg-bg-primary p-4">
          <p className="whitespace-pre-wrap text-[15px] leading-[1.6] text-text-primary">
            {piece.body}
          </p>
        </div>

        <div className="space-y-3">
          {piece.metadata?.visualPrompt && piece.metadata.mediaType !== "none" && (
            <VisualBrief
              pieceId={piece.id}
              mediaType={piece.metadata.mediaType ?? "image"}
              prompt={piece.metadata.visualPrompt}
              imageUrl={piece.metadata.mediaAsset?.url}
            />
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border-subtle bg-bg-elevated p-3">
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
              <span className="text-sm text-text-muted">
                {needsImage(piece)
                  ? "Upload image to unlock approval."
                  : "Already handled. Move to the next post."}
              </span>
            )}
          </div>
        </div>
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
    <div className="rounded-md border border-border-subtle bg-bg-elevated p-3">
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
        Drop in the image you want paired with this post. Square or portrait is
        safest. Once it is added, this post can move forward.
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
