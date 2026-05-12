"use client";

import { useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

export function SaveRunMemoryButton({ runId }: { runId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function saveMemory() {
    if (status === "saving") return;

    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/memory/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Memory save failed.");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Memory save failed.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={saveMemory}
        disabled={status === "saving" || status === "saved"}
        className="h-10 rounded-md border border-border bg-bg-surface px-4 text-sm font-medium text-text-primary shadow-card transition-all hover:bg-bg-hover disabled:opacity-60"
      >
        {status === "saving"
          ? "Saving memory..."
          : status === "saved"
            ? "Saved to Memory"
            : "Save run to Memory"}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
