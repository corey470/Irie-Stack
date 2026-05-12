import { redirect } from "next/navigation";
import { MediaUploadButton } from "../media-upload-button";
import { getAppContext } from "@/lib/app-auth";
import { maskedExternalId } from "@/lib/platform-destinations";

type RelayPostRow = {
  id: string;
  source_app: string;
  source_record_id: string | null;
  platform: string;
  title: string;
  body: string;
  status: string;
  mode: string;
  scheduled_for: string | null;
  posted_at: string | null;
  posted_url: string | null;
  media:
    | {
        prompt?: string;
        mediaType?: string;
        status?: string;
        url?: string | null;
      }[]
    | null;
  validation: {
    ok?: boolean;
    actualChars?: number;
    maxChars?: number | null;
    qualityScore?: number;
  } | null;
  error_message: string | null;
  destination: { label: string; external_id: string | null } | null;
};

const STATUSES = ["pending_approval", "approved", "posted", "failed", "draft"] as const;

export default async function RelayPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const params = await searchParams;
  const status = STATUSES.includes(params.status as (typeof STATUSES)[number])
    ? params.status
    : "approved";

  const { data: posts, error } = await supabase
    .from("social_relay_posts")
    .select(
      "id, source_app, source_record_id, platform, title, body, status, mode, scheduled_for, posted_at, posted_url, media, validation, error_message, destination:platform_destinations(label, external_id)"
    )
    .eq("user_id", user.id)
    .eq("status", status)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(75);

  const rows = (posts ?? []) as unknown as RelayPostRow[];

  return (
    <div className="max-w-6xl">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
        Posting Queue
      </p>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
        Posts waiting to go out.
      </h1>
      <p className="mt-4 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
        This is where approved posts wait for their scheduled time, show posting
        problems, and keep receipts after they go live.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <a
            key={item}
            href={`/app/relay?status=${item}`}
            className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium transition-colors ${
              item === status
                ? "border-border-strong bg-bg-active text-text-primary"
                : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover"
            }`}
          >
            {statusLabel(item)}
          </a>
        ))}
      </nav>

      {error ? (
        <p className="mt-8 rounded-md border border-destructive/30 bg-bg-elevated p-4 text-sm text-destructive">
          Could not load posting queue.
        </p>
      ) : (
        <section className="mt-8 space-y-4">
          {rows.map((post) => (
            <RelayCard key={post.id} post={post} />
          ))}
          {rows.length === 0 && (
            <div className="rounded-md border border-border bg-bg-surface p-6 text-sm text-text-secondary shadow-card">
              No posts here yet. Approved posts will show here after you review a plan.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function RelayCard({ post }: { post: RelayPostRow }) {
  return (
    <article className="rounded-md border border-border bg-bg-surface p-5 shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted">
            <span>{pretty(post.platform)}</span>
            <span>{post.source_app}</span>
            <span>{pretty(post.mode)}</span>
            {post.destination && (
              <span>
                {post.destination.label} · {maskedExternalId(post.destination.external_id)}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-text-primary">{post.title}</h2>
          <p className="mt-1 text-xs text-text-muted">
            {post.scheduled_for ? new Date(post.scheduled_for).toLocaleString() : "Unscheduled"}
          </p>
        </div>
        <div className="text-right text-xs uppercase tracking-wider text-text-muted">
          <div>{pretty(post.status)}</div>
          <div className="mt-1">
            {charLabel(post.validation, post.body)}
            {typeof post.validation?.qualityScore === "number"
              ? ` · Quality ${post.validation.qualityScore}`
              : ""}
          </div>
        </div>
      </header>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.65] text-text-primary">
        {post.body}
      </p>

      {post.media?.map((item, index) =>
        item.prompt ? (
          <VisualBrief
            key={`${post.id}-media-${index}`}
            pieceId={post.source_app === "irie-stack" ? post.source_record_id : null}
            mediaType={item.mediaType ?? "image"}
            prompt={item.prompt}
            status={item.status}
            imageUrl={item.url}
          />
        ) : null
      )}

      <footer className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        {post.error_message && <span className="text-destructive">{post.error_message}</span>}
        {post.posted_url && (
          <a
            href={post.posted_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent-deep underline underline-offset-2"
          >
            View posted update
          </a>
        )}
      </footer>
    </article>
  );
}

function VisualBrief({
  pieceId,
  mediaType,
  prompt,
  status,
  imageUrl,
}: {
  pieceId: string | null;
  mediaType: string;
  prompt: string;
  status?: string;
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
        {status && (
          <span className="rounded-sm bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
            {pretty(status)}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{prompt}</p>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        Make this in Canva, use a real photo, pull a product image, or use any
        image tool you like. Upload the finished image here.
      </p>
      {pieceId && <MediaUploadButton pieceId={pieceId} initialUrl={imageUrl} />}
    </div>
  );
}

function pretty(value: string) {
  return value
    .replace(/^x$/, "X")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(value: string) {
  if (value === "draft") return "Draft posts";
  if (value === "pending_approval") return "Needs review";
  if (value === "approved") return "Approved";
  if (value === "failed") return "Issues";
  return pretty(value);
}

function charLabel(
  validation: RelayPostRow["validation"],
  body: string
) {
  const actual = validation?.actualChars ?? body.length;
  const max = validation?.maxChars;
  if (!max || max > 5000) return `${actual} chars`;
  return `${actual}/${max} chars`;
}
