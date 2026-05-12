"use client";

import { useState } from "react";

type Status = "idle" | "posting" | "posted" | "error";

export function PublishButton({ pieceId }: { pieceId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [postedUrl, setPostedUrl] = useState<string | null>(null);

  async function publish() {
    if (status === "posting") return;

    setStatus("posting");
    setError(null);

    try {
      const res = await fetch("/api/publish/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Posting failed.");
      setPostedUrl(body.postedUrl ?? null);
      setStatus("posted");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Posting failed.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={publish}
        disabled={status === "posting" || status === "posted"}
        className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-text-primary shadow-card transition-all hover:bg-accent-light disabled:opacity-60"
      >
        {status === "posting"
          ? "Posting..."
          : status === "posted"
            ? "Posted"
            : "Post"}
      </button>
      {postedUrl && (
        <a
          href={postedUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-accent-deep underline underline-offset-2"
        >
          View
        </a>
      )}
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
