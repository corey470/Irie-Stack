"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

const PROMPT_HINTS = [
  'Examples: "I open with a scene more than a thesis."',
  '"I never use the word ‘leverage.’ Or ‘unlock.’"',
  '"I write like I talk to a friend at a coffee shop."',
  '"My posts usually end with a small reframe, not a question."',
];

export function StackEditor({
  initialName,
  initialVoiceNotes,
  updatedAt,
}: {
  initialName: string;
  initialVoiceNotes: string;
  updatedAt: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [voiceNotes, setVoiceNotes] = useState(initialVoiceNotes);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(updatedAt);

  // Reset "saved" indicator after 2.5s
  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/stack", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, voice_notes: voiceNotes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't save your Stack.");
      }
      setStatus("saved");
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <label
          htmlFor="stack-name"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Stack name
        </label>
        <input
          id="stack-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="h-12 w-full max-w-md rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary shadow-card transition-colors focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor="voice-notes"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          How you talk
        </label>
        <p className="mb-3 text-sm text-text-muted">
          Write freely. Bullet points, full sentences, contradictions — all
          fine. The system will read every word.
        </p>
        <textarea
          id="voice-notes"
          rows={14}
          value={voiceNotes}
          onChange={(e) => setVoiceNotes(e.target.value)}
          maxLength={20000}
          placeholder={PROMPT_HINTS.join("\n")}
          className="w-full rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary placeholder:text-text-muted shadow-card transition-colors focus:border-accent resize-y"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>{voiceNotes.length.toLocaleString()} / 20,000</span>
          {lastSavedAt && status === "idle" && (
            <span>Last saved {new Date(lastSavedAt).toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="h-12 rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save Stack"}
        </button>
        {status === "saved" && (
          <span
            role="status"
            aria-live="polite"
            className="text-sm text-success"
          >
            Saved.
          </span>
        )}
        {status === "error" && error && (
          <span role="alert" className="text-sm text-destructive">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
