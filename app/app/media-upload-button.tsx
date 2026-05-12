"use client";

import { useRef, useState } from "react";

type Status = "idle" | "uploading" | "ready" | "error";

export function MediaUploadButton({
  pieceId,
  initialUrl,
}: {
  pieceId: string;
  initialUrl?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>(initialUrl ? "ready" : "idle");
  const [url, setUrl] = useState(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file || status === "uploading") return;
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("pieceId", pieceId);
    formData.set("file", file);

    try {
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Image upload failed.");
      setUrl(body.asset?.url ?? null);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Upload image for this post"
        className="sr-only"
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="min-h-11 rounded-md border border-border-strong bg-bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-60"
      >
        {status === "uploading"
          ? "Uploading..."
          : status === "ready"
            ? "Replace image"
            : "Upload image"}
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent-deep underline underline-offset-2"
        >
          View image
        </a>
      )}
      {status === "ready" && (
        <span role="status" aria-live="polite" className="text-xs text-text-secondary">
          Uploaded. You can approve this post now.
        </span>
      )}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-16 w-16 rounded-md border border-border object-cover"
        />
      )}
    </div>
  );
}
