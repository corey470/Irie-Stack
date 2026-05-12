"use client";

import { useEffect, useState } from "react";
import { MediaUploadButton } from "@/app/app/media-upload-button";

type PieceValidation = {
  ok: boolean;
  maxChars: number | null;
  actualChars: number;
  qualityScore?: number;
  errors: string[];
  warnings: string[];
};

type Piece = {
  id: string | null;
  platform: string;
  level: string;
  format: string;
  title: string;
  hook?: string;
  body: string;
  cta?: string;
  visual_prompt?: string;
  media_type?: "none" | "image" | "carousel" | "video";
  slides?: { text: string; image_prompt: string }[];
  scheduled_for: string;
  validation: PieceValidation;
  status:
    | "draft"
    | "needs_revision"
    | "pending_approval"
    | "approved"
    | "posted"
    | "rejected"
    | "failed";
  approval_request_id?: string | null;
  approval_status?: string | null;
  posted_url?: string | null;
};

type Run = {
  id: string | null;
  name: string;
  summary: string;
  starts_on: string;
  target_days: number;
};

type Status = "idle" | "running" | "done" | "error";
type SourceMode = "paste" | "url";
type ApprovalCadence = "monthly" | "weekly" | "daily" | "individual" | "autopilot";

const DEFAULT_POSTING_TIMES = ["09:00", "12:00", "15:00", "18:00"];

const SAMPLE = `From a Tuesday voice memo:

Three years building solo taught me one thing: the work that compounds is rarely the loudest work. It's the work that repeats. Showing up Tuesday after Tuesday, even when nobody is watching, is the whole job.`;

export function Generator() {
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("paste");
  const [approvalCadence, setApprovalCadence] =
    useState<ApprovalCadence>("monthly");
  const [postingTimes, setPostingTimes] = useState(DEFAULT_POSTING_TIMES);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [run, setRun] = useState<Run | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const savedFuel = window.localStorage.getItem("iriestack.contentFuel");
    if (!savedFuel) return;

    setSource(savedFuel);
    setSourceMode("paste");
    window.localStorage.removeItem("iriestack.contentFuel");
  }, []);

  async function generate() {
    if (sourceMode === "paste" && source.trim().length < 20) {
      setError("Add at least 20 characters of source material.");
      return;
    }
    if (sourceMode === "url" && !sourceUrl.trim()) {
      setError("Add a source URL.");
      return;
    }
    if (!rightsConfirmed) {
      setError("Confirm that you own this content or have permission to use it.");
      return;
    }

    setStatus("running");
    setError(null);
    setWarning(null);
    setRun(null);
    setPieces([]);
    setElapsed(0);

    const start = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000));
    }, 250);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sourceMode === "url"
            ? {
                sourceUrl,
                rightsConfirmed,
                approvalCadence,
                postingTimes,
                timezoneOffsetMinutes: new Date().getTimezoneOffset(),
              }
            : {
                source,
                rightsConfirmed,
                approvalCadence,
                postingTimes,
                timezoneOffsetMinutes: new Date().getTimezoneOffset(),
              }
        ),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Generation failed.");

      setRun(body.run ?? null);
      setPieces(body.pieces ?? []);
      setWarning(body.persistenceWarning ?? null);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      clearInterval(tick);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-border bg-bg-surface shadow-card">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["paste", "url"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setSourceMode(mode);
                setError(null);
              }}
              className={`h-10 rounded-md border px-4 text-sm font-medium transition-colors ${
                sourceMode === mode
                  ? "border-border-strong bg-bg-active text-text-primary"
                  : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {mode === "paste" ? "Use source" : "Use URL"}
            </button>
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="source"
            className="block text-sm font-medium text-text-primary"
          >
            {sourceMode === "url" ? "Link to use" : "What should this month be about?"}
          </label>
          {sourceMode === "paste" && !source && (
            <button
              type="button"
              onClick={() => setSource(SAMPLE)}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              Try a sample
            </button>
          )}
        </div>

        {sourceMode === "url" ? (
          <>
            <input
              id="source"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={status === "running"}
              placeholder="https://example.com/post-or-transcript"
              className="h-12 w-full rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary shadow-card transition-colors placeholder:text-text-muted focus:border-accent disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-text-muted">
              We read the public page, pull the useful text, and use up to
              12,000 characters as source material.
            </p>
          </>
        ) : (
          <>
            <textarea
              id="source"
              rows={8}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={12000}
              disabled={status === "running"}
              placeholder="Paste the source draft, transcript, rough thought, or campaign brief..."
              className="w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card transition-colors placeholder:text-text-muted focus:border-accent disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
              <span>{source.length.toLocaleString()} / 12,000</span>
              <span>Min 20 chars</span>
            </div>
          </>
        )}

          </div>

          <aside className="border-t border-border-subtle bg-bg-elevated p-4 xl:border-l xl:border-t-0">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
              Posting Defaults
            </p>
            <p className="mb-4 text-sm leading-relaxed text-text-secondary">
              These are just defaults. You can change individual posts from the
              calendar and review screens.
            </p>
        <div className="grid gap-4">
          <div>
            <label
              htmlFor="approvalCadence"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              How much do you want to approve?
            </label>
            <select
              id="approvalCadence"
              value={approvalCadence}
              onChange={(event) =>
                setApprovalCadence(event.target.value as ApprovalCadence)
              }
              disabled={status === "running"}
              className="h-12 w-full rounded-md border border-border bg-bg-surface px-3 text-[15px] text-text-primary shadow-card focus:border-accent disabled:opacity-60"
            >
              <option value="monthly">Review the whole month</option>
              <option value="weekly">Review one week at a time</option>
              <option value="daily">Review each day</option>
              <option value="individual">Approve every post</option>
              <option value="autopilot">Autopilot when ready</option>
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label className="block text-sm font-medium text-text-primary">
              Posting times
              </label>
              <span className="text-xs text-text-muted">Your local time</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {postingTimes.map((time, index) => (
                <input
                  key={index}
                  type="time"
                  value={time}
                  onChange={(event) => {
                    const next = [...postingTimes];
                    next[index] = event.target.value;
                    setPostingTimes(next);
                  }}
                  disabled={status === "running"}
                  className="h-12 rounded-md border border-border bg-bg-surface px-3 text-[15px] text-text-primary shadow-card focus:border-accent disabled:opacity-60"
                  aria-label={`Posting time ${index + 1}`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              If a day has several posts, IrieStack uses these times in order.
            </p>
          </div>
        </div>

        <label className="mt-4 flex max-w-3xl items-start gap-3 rounded-md border border-border bg-bg-elevated p-3 text-sm leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            checked={rightsConfirmed}
            onChange={(event) => setRightsConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-accent"
          />
          <span>
            I own this content or have permission to repurpose it. I understand
            IrieStack helps transform source material, but I am responsible for
            copyright, permissions, plagiarism, and what gets posted.
          </span>
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={
              status === "running" ||
              (sourceMode === "paste" && source.trim().length < 20) ||
              (sourceMode === "url" && !sourceUrl.trim()) ||
              !rightsConfirmed
            }
            className="h-12 rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60"
          >
              {status === "running" ? `Building calendar... ${elapsed}s` : "Build calendar"}
          </button>
          {status === "done" && pieces.length > 0 && (
            <span className="text-sm text-text-muted">
              {pieces.length} pieces drafted
            </span>
          )}
          {error && (
            <span role="alert" className="text-sm text-destructive">
              {error}
            </span>
          )}
        </div>
          </aside>
        </div>
      </section>

      {status === "running" && (
        <section>
          <p className="text-sm text-text-secondary">
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent align-middle" />
            Building the month: posts, platform versions, visual briefs, review
            list, and schedule.
          </p>
        </section>
      )}

      {warning && (
        <p className="rounded-md border border-warning/30 bg-bg-elevated p-3 text-sm text-text-secondary">
          {warning}
        </p>
      )}

      {run && pieces.length > 0 && <RunOutput run={run} pieces={pieces} />}
    </div>
  );
}

function RunOutput({ run, pieces }: { run: Run; pieces: Piece[] }) {
  const invalid = pieces.filter((piece) => !piece.validation.ok).length;
  const levelCounts = countBy(pieces, "level");
  const imageCount = pieces.filter((piece) => piece.visual_prompt && piece.media_type !== "none").length;

  return (
    <section className="space-y-8">
      <header className="border-y border-border-subtle py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
              Posting Plan
            </p>
            {run.id ? (
              <a
                href={`/app/runs/${run.id}`}
                className="font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-text-primary underline decoration-border-strong underline-offset-4"
              >
                {run.name}
              </a>
            ) : (
              <h2 className="font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-text-primary">
                {run.name}
              </h2>
            )}
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
              {run.summary}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Pieces" value={pieces.length.toString()} />
            <Metric label="Days" value={run.target_days.toString()} />
            <Metric label="Flags" value={invalid.toString()} />
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <LevelStat label="Level 1" value={levelCounts.level_1 ?? 0} />
        <LevelStat label="Level 2" value={levelCounts.level_2 ?? 0} />
        <LevelStat label="Level 3" value={levelCounts.level_3 ?? 0} />
      </div>

      <NextStepsGuide runId={run.id} imageCount={imageCount} invalidCount={invalid} />

      <div>
        <header className="mb-6 flex items-baseline gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.22em] text-accent-deep">
            Draft Posts
          </h3>
          <span className="h-px flex-1 bg-border-subtle" />
        </header>
        <div className="space-y-6">
          {pieces.map((piece, index) => (
            <PieceCard
              key={`${piece.platform}-${piece.title}-${index}`}
              piece={piece}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function NextStepsGuide({
  runId,
  imageCount,
  invalidCount,
}: {
  runId: string | null;
  imageCount: number;
  invalidCount: number;
}) {
  return (
    <section className="rounded-md border border-border bg-bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
            What happens next
          </p>
          <h3 className="font-display text-2xl leading-tight text-text-primary">
            Review the plan, add images, then approve.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            These drafts are saved into your 30-day plan. Each post has copy,
            a scheduled time, and when needed, a visual brief for the image or
            carousel that should go with it.
          </p>
        </div>
        {runId && (
          <a
            href={`/app/runs/${runId}`}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light"
          >
            Open calendar plan
          </a>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <GuideCard
          title="1. Check the copy"
          body="Skim the posts. Green quality means it is usable. Orange notes are suggestions, not always blockers."
        />
        <GuideCard
          title="2. Add images"
          body={`${imageCount} posts include visual briefs. Make the image in Canva or use a real photo, then upload it on the post.`}
        />
        <GuideCard
          title="3. Open the plan"
          body="The plan view lays this out by day, so you can see how the month will land."
        />
        <GuideCard
          title="4. Approve to queue"
          body="Approved posts move to the posting queue. Posted items become receipts."
        />
      </div>

      {invalidCount > 0 && (
        <p className="mt-4 rounded-md border border-warning/30 bg-bg-elevated p-3 text-sm text-text-secondary">
          {invalidCount} posts need cleanup before they can be approved. Look for
          the orange or red notes under the post.
        </p>
      )}
    </section>
  );
}

function GuideCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg-elevated p-4">
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{body}</p>
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

function LevelStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-bg-surface p-4 shadow-card">
      <div className="text-xs uppercase tracking-[0.16em] text-text-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl text-text-primary">{value}</div>
    </div>
  );
}

function PieceCard({
  piece,
  defaultExpanded,
}: {
  piece: Piece;
  defaultExpanded: boolean;
}) {
  const [title, setTitle] = useState(piece.title);
  const [body, setBody] = useState(piece.body);
  const [validation, setValidation] = useState(piece.validation);
  const [pieceStatus, setPieceStatus] = useState(piece.status);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [approvalState, setApprovalState] = useState<
    "idle" | "requesting" | "requested" | "error"
  >(piece.approval_request_id ? "requested" : "idle");
  const [publishState, setPublishState] = useState<
    "idle" | "posting" | "posted" | "error"
  >(piece.posted_url ? "posted" : "idle");
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(piece.title);
  const [draftBody, setDraftBody] = useState(piece.body);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [postedUrl, setPostedUrl] = useState(piece.posted_url ?? null);
  const fieldIdBase = piece.id ?? piece.title.replace(/\W+/g, "-");
  const titleInputId = `edit-title-${fieldIdBase}`;
  const bodyInputId = `edit-body-${fieldIdBase}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is convenience only.
    }
  }

  function startEditing() {
    setDraftTitle(title);
    setDraftBody(body);
    setSaveError(null);
    setSaveState("idle");
    setIsExpanded(true);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftTitle(title);
    setDraftBody(body);
    setSaveError(null);
    setSaveState("idle");
    setIsEditing(false);
  }

  async function saveEdit() {
    if (!piece.id || saveState === "saving") return;

    setSaveState("saving");
    setSaveError(null);

    try {
      const res = await fetch(`/api/pieces/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle, body: draftBody }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not save post.");

      const updated = payload.piece as {
        title: string;
        body: string;
        status: Piece["status"];
        approval_status: string | null;
        validation: PieceValidation;
      };
      setTitle(updated.title);
      setBody(updated.body);
      setPieceStatus(updated.status);
      setValidation(updated.validation);
      setApprovalState("idle");
      setApprovalError(null);
      setSaveState("saved");
      setIsEditing(false);
      setTimeout(() => setSaveState("idle"), 1500);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Could not save post.");
    }
  }

  async function requestApproval() {
    if (!piece.id || approvalState === "requesting") return;

    setApprovalState("requesting");
    setApprovalError(null);

    try {
      const res = await fetch("/api/approvals/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId: piece.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Approval request failed.");
      setPieceStatus("pending_approval");
      setApprovalState("requested");
    } catch (err) {
      setApprovalState("error");
      setApprovalError(
        err instanceof Error ? err.message : "Approval request failed."
      );
    }
  }

  async function publishToX() {
    if (!piece.id || publishState === "posting") return;

    setPublishState("posting");
    setPublishError(null);

    try {
      const res = await fetch("/api/publish/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId: piece.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "X posting failed.");
      setPostedUrl(body.postedUrl ?? null);
      setPieceStatus("posted");
      setPublishState("posted");
    } catch (err) {
      setPublishState("error");
      setPublishError(err instanceof Error ? err.message : "X posting failed.");
    }
  }

  const canPublish =
    piece.id &&
    validation.ok &&
    pieceStatus === "approved" &&
    piece.format !== "thread";

  return (
    <article className="border-t border-border-subtle pt-5">
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          {pretty(piece.platform)}
        </span>
        <span className="rounded-sm bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-text-muted">
          {pretty(piece.level)}
        </span>
        <span className="rounded-sm bg-bg-elevated px-2 py-1 text-[11px] uppercase tracking-wider text-text-muted">
          {pretty(piece.format)}
        </span>
        <span aria-hidden="true" className="hidden h-px flex-1 bg-border-subtle sm:block" />
        <span className="text-[11px] text-text-muted">
          {new Date(piece.scheduled_for).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        <span
          className={`text-[11px] ${
            validation.ok ? "text-success" : "text-destructive"
          }`}
        >
          {validation.actualChars}
          {validation.maxChars ? `/${validation.maxChars}` : ""} chars
        </span>
        {typeof validation.qualityScore === "number" && (
          <span
            className={`text-[11px] ${
              validation.qualityScore >= 80
                ? "text-success"
                : validation.qualityScore >= 68
                  ? "text-warning"
                  : "text-destructive"
            }`}
          >
            Quality {validation.qualityScore}
          </span>
        )}
        <span className="text-[11px] uppercase tracking-wider text-text-muted">
          {pretty(pieceStatus)}
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="text-[11px] uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
        >
          {isExpanded ? "Close" : "Open"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        {piece.id && pieceStatus !== "posted" && (
          <button
            type="button"
            onClick={isEditing ? cancelEditing : startEditing}
            disabled={saveState === "saving"}
            className="text-[11px] uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary disabled:text-text-muted"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        )}
        {piece.id && validation.ok && !isEditing && (
          <button
            type="button"
            onClick={requestApproval}
            disabled={
              approvalState === "requesting" || approvalState === "requested"
            }
            className="text-[11px] uppercase tracking-wider text-accent-deep transition-colors hover:text-text-primary disabled:text-text-muted"
          >
            {approvalState === "requesting"
              ? "Requesting"
              : approvalState === "requested"
                ? "Approval Sent"
                : "Request Approval"}
          </button>
        )}
        {canPublish && (
          <button
            type="button"
            onClick={publishToX}
            disabled={publishState === "posting" || publishState === "posted"}
            className="text-[11px] uppercase tracking-wider text-accent-deep transition-colors hover:text-text-primary disabled:text-text-muted"
          >
            {publishState === "posting"
              ? "Posting"
              : publishState === "posted"
                ? "Posted"
                : "Post"}
          </button>
        )}
      </header>

      {!isExpanded && !isEditing && (
        <>
          <h4 className="mb-2 text-base font-semibold text-text-primary">
            {title}
          </h4>
          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {body}
          </p>
        </>
      )}

      {isEditing ? (
        <div className="space-y-3 rounded-md border border-border bg-bg-surface p-4 shadow-card">
          <div>
            <label
              htmlFor={titleInputId}
              className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
            >
              Post title
            </label>
            <input
              id={titleInputId}
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              maxLength={160}
              className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-[15px] text-text-primary focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor={bodyInputId}
              className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-text-muted"
            >
              Post copy
            </label>
            <textarea
              id={bodyInputId}
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              rows={8}
              className="w-full resize-y rounded-md border border-border bg-bg-elevated px-3 py-2 text-[15px] leading-[1.6] text-text-primary focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveEdit}
              disabled={saveState === "saving" || !draftTitle.trim() || !draftBody.trim()}
              className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light disabled:opacity-60"
            >
              {saveState === "saving" ? "Saving" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="min-h-11 rounded-md border border-border bg-bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <span className="text-xs text-text-muted">
              Saving edits returns the post to Draft so it can be approved again.
            </span>
          </div>
        </div>
      ) : isExpanded ? (
        <>
          <h4 className="mb-2 text-base font-semibold text-text-primary">
            {title}
          </h4>
          <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-text-primary">
            {body}
          </p>
        </>
      ) : null}

      {isExpanded && piece.visual_prompt && piece.media_type !== "none" && (
        <VisualBrief
          pieceId={piece.id}
          mediaType={piece.media_type ?? "image"}
          prompt={piece.visual_prompt}
        />
      )}

      {isExpanded && piece.slides && piece.slides.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {piece.slides.map((slide, index) => (
            <div
              key={`${slide.text}-${index}`}
              className="rounded-md border border-border-subtle bg-bg-elevated p-3"
            >
              <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">
                Slide {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-text-primary">
                {slide.text}
              </p>
              {slide.image_prompt && (
                <p className="mt-2 border-t border-border-subtle pt-2 text-xs leading-relaxed text-text-secondary">
                  {slide.image_prompt}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {(validation.errors.length > 0 ||
        validation.warnings.length > 0 ||
        saveError ||
        saveState === "saved" ||
        approvalError ||
        publishError ||
        postedUrl) && (
        <div className="mt-4 space-y-1 text-xs">
          {validation.errors.map((item) => (
            <p key={item} className="text-destructive">
              {item}
            </p>
          ))}
          {validation.warnings.map((item) => (
            <p key={item} className="text-warning">
              {item}
            </p>
          ))}
          {saveState === "saved" && (
            <p className="text-success">Saved. This post is back in Draft.</p>
          )}
          {saveError && <p className="text-destructive">{saveError}</p>}
          {approvalError && <p className="text-destructive">{approvalError}</p>}
          {publishError && <p className="text-destructive">{publishError}</p>}
          {postedUrl && (
            <a
              href={postedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-accent-deep underline underline-offset-2"
            >
              View posted X update
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function VisualBrief({
  pieceId,
  mediaType,
  prompt,
}: {
  pieceId: string | null;
  mediaType: NonNullable<Piece["media_type"]>;
  prompt: string;
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
        Make this in Canva, use a real photo, grab a product image, or use any
        image tool you like. Upload the finished image here. Once uploaded, it
        travels with this post into the plan, approval queue, and posting queue.
      </p>
      {pieceId && <MediaUploadButton pieceId={pieceId} />}
    </div>
  );
}

function pretty(value: string): string {
  return value
    .replace(/^x$/, "X")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function countBy(items: Piece[], key: "level" | "platform" | "format") {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
