"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CalendarPiece = {
  id: string;
  platform: string;
  title: string;
  body: string;
  status: string;
  scheduled_for: string | null;
  metadata: {
    mediaType?: string | null;
    visualPrompt?: string | null;
    mediaAsset?: { url?: string | null } | null;
  } | null;
};

export type CalendarDay = {
  key: string;
  dayNumber: number;
  label: string;
};

export function CalendarBoard({
  days,
  piecesByDate,
  runId,
}: {
  days: CalendarDay[];
  piecesByDate: Record<string, CalendarPiece[]>;
  runId: string;
}) {
  const firstPiece = useMemo(() => {
    for (const day of days) {
      const piece = piecesByDate[day.key]?.[0];
      if (piece) return piece;
    }
    return null;
  }, [days, piecesByDate]);
  const [selectedPiece, setSelectedPiece] = useState<CalendarPiece | null>(firstPiece);

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="md:hidden">
          <MobileAgenda
            days={days}
            piecesByDate={piecesByDate}
            onSelect={setSelectedPiece}
            selectedId={selectedPiece?.id}
          />
        </div>

        <div className="hidden overflow-x-auto pb-3 md:block">
          <div className="grid min-w-[980px] grid-cols-7 gap-2">
            {days.map((day) => (
              <DayCell
                key={day.key}
                day={day}
                pieces={piecesByDate[day.key] ?? []}
                onSelect={setSelectedPiece}
                selectedId={selectedPiece?.id}
              />
            ))}
          </div>
        </div>
      </div>

      <PostDrawer piece={selectedPiece} runId={runId} />
    </div>
  );
}

function DayCell({
  day,
  pieces,
  onSelect,
  selectedId,
}: {
  day: CalendarDay;
  pieces: CalendarPiece[];
  onSelect: (piece: CalendarPiece) => void;
  selectedId?: string;
}) {
  return (
    <article className="min-h-[118px] rounded-md border border-border bg-bg-surface p-2 shadow-card transition-colors hover:border-border-strong">
      <header className="mb-2 flex items-baseline justify-between gap-2">
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
          <button
            key={piece.id}
            type="button"
            title={`${pretty(piece.platform)} · ${operatorStatus(piece)} · ${formatTime(
              piece.scheduled_for
            )}\n${piece.title}\n\n${piece.body}`}
            onClick={() => onSelect(piece)}
            className={`flex min-h-8 w-full items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md border px-2 py-1 text-left text-xs leading-tight transition-colors hover:bg-bg-hover ${statusClass(
              piece.status
            )} ${selectedId === piece.id ? "ring-2 ring-accent" : ""}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(piece.status)}`} />
            <span className="shrink-0 font-semibold">{compactPlatform(piece.platform)}</span>
            <span className="shrink-0 text-text-muted">{compactDayPeriod(piece.scheduled_for)}</span>
            <span className="min-w-0 truncate">{compactCalendarTitle(piece.title)}</span>
          </button>
        ))}
        {pieces.length > 4 && (
          <button
            type="button"
            onClick={() => onSelect(pieces[4])}
            className="block w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-bg-hover"
          >
            +{pieces.length - 4} more
          </button>
        )}
        {pieces.length === 0 && (
          <p className="pt-3 text-xs text-text-muted">Quiet day.</p>
        )}
      </div>
    </article>
  );
}

function MobileAgenda({
  days,
  piecesByDate,
  onSelect,
  selectedId,
}: {
  days: CalendarDay[];
  piecesByDate: Record<string, CalendarPiece[]>;
  onSelect: (piece: CalendarPiece) => void;
  selectedId?: string;
}) {
  return (
    <div className="space-y-3">
      {days.map((day) => {
        const pieces = piecesByDate[day.key] ?? [];
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
              <span className="text-xs text-text-muted">{pieces.length} posts</span>
            </header>
            <div className="space-y-2">
              {pieces.map((piece) => (
                <button
                  key={piece.id}
                  type="button"
                  onClick={() => onSelect(piece)}
                  className={`flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-border bg-bg-elevated p-3 text-left text-sm ${
                    selectedId === piece.id ? "ring-2 ring-accent" : ""
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(piece.status)}`} />
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {compactPlatform(piece.platform)}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-text-muted">
                    {compactDayPeriod(piece.scheduled_for)}
                  </span>
                  <span className="truncate font-medium text-text-primary">
                    {compactCalendarTitle(piece.title)}
                  </span>
                </button>
              ))}
              {pieces.length === 0 && (
                <p className="text-sm text-text-muted">Quiet day.</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PostDrawer({ piece, runId }: { piece: CalendarPiece | null; runId: string }) {
  if (!piece) {
    return (
      <aside className="rounded-md border border-border bg-bg-surface p-5 shadow-card xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
        <p className="workspace-kicker">Post detail</p>
        <h2 className="font-display text-2xl text-text-primary">Pick a post.</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Click any calendar chip and the copy, image need, and next action will show here.
        </p>
      </aside>
    );
  }

  const needsVisual = needsImage(piece);

  return (
    <aside className="rounded-md border border-border bg-bg-surface shadow-card xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-y-auto">
      <div className="border-b border-border-subtle p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-text-muted">
          <span className="rounded-full bg-bg-elevated px-2 py-1 font-semibold text-text-primary">
            {pretty(piece.platform)}
          </span>
          <span>{formatTime(piece.scheduled_for)}</span>
          <span>{operatorStatus(piece)}</span>
        </div>
        <h2 className="text-base font-semibold leading-snug text-text-primary">
          {piece.title}
        </h2>
      </div>

      <div className="space-y-3 p-4">
        <section className="rounded-md border border-border-subtle bg-bg-primary p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
            {piece.body}
          </p>
        </section>

        <section className="rounded-md border border-border-subtle bg-bg-elevated p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
            Next action
          </p>
          <p className="mt-1 text-sm text-text-primary">
            {needsVisual
              ? "Add the image for this post, then it can move into approval."
              : piece.status === "approved"
                ? "This post is approved and ready for delivery."
                : "Review the copy, then approve it when it feels right."}
          </p>
        </section>

        {piece.metadata?.visualPrompt && piece.metadata.mediaType !== "none" && (
          <section className="rounded-md border border-border-subtle bg-bg-elevated p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
              Visual brief
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {piece.metadata.visualPrompt}
            </p>
          </section>
        )}

        <Link
          href={`/app/runs/${runId}#post-${piece.id}`}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-accent px-3 text-sm font-medium text-text-primary hover:bg-accent/80"
        >
          Open full post
        </Link>
      </div>
    </aside>
  );
}

function statusClass(status: string) {
  if (status === "posted") return "border-accent bg-accent/20 text-text-primary";
  if (status === "approved") return "border-success/30 bg-success/10 text-text-primary";
  if (status === "failed") return "border-destructive/30 bg-destructive/10 text-destructive";
  return "border-border bg-bg-elevated text-text-primary";
}

function statusDotClass(status: string) {
  if (status === "posted") return "bg-accent-deep";
  if (status === "approved") return "bg-success";
  if (status === "failed") return "bg-destructive";
  if (status === "pending_approval") return "bg-accent";
  return "bg-text-muted";
}

function needsImage(piece: CalendarPiece) {
  const mediaType = piece.metadata?.mediaType;
  return Boolean(mediaType && mediaType !== "none" && !piece.metadata?.mediaAsset?.url);
}

function operatorStatus(piece: CalendarPiece) {
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

function compactPlatform(value: string) {
  if (value.toLowerCase() === "linkedin") return "In";
  if (value.toLowerCase() === "instagram") return "IG";
  if (value.toLowerCase() === "facebook") return "FB";
  if (value.toLowerCase() === "threads") return "Th";
  if (value.toLowerCase() === "tiktok") return "TT";
  return pretty(value);
}

function compactDayPeriod(value: string | null) {
  if (!value) return "";
  const label = formatTime(value);
  return label.match(/\b(AM|PM)\b/i)?.[0]?.toUpperCase() ?? "";
}

function compactCalendarTitle(title: string) {
  const level = title.match(/\bL[123]\b/i)?.[0]?.toUpperCase();
  let clean = title
    .replace(/\s+[—-]\s+(Facebook|Instagram|LinkedIn|Threads|Tiktok|TikTok|X).*$/i, "")
    .replace(/^(Facebook|Instagram|LinkedIn|Threads|Tiktok|TikTok|X)\s*[:—-]\s*/i, "")
    .replace(/^L[123]\s*/i, "")
    .replace(/^Core\s*[—:-]\s*/i, "Core ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) clean = "Post";
  return [level, clean].filter(Boolean).join(" ");
}
