"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

type Question = {
  id: string;
  label: string;
  question: string;
  placeholder: string;
};

const QUESTIONS: Question[] = [
  {
    id: "audience",
    label: "Audience",
    question: "Who are you usually talking to?",
    placeholder: "Example: founders, parents, local business owners, people trying to get healthier...",
  },
  {
    id: "tone",
    label: "Tone",
    question: "How should your posts feel when someone reads them?",
    placeholder: "Example: direct but warm, practical, a little funny, never corporate...",
  },
  {
    id: "beliefs",
    label: "Beliefs",
    question: "What are a few things you believe that show up in your work?",
    placeholder: "Example: consistency beats hype. Simple systems win. People need less noise...",
  },
  {
    id: "phrases",
    label: "Phrases",
    question: "What are words or phrases you actually say?",
    placeholder: "Example: off my plate, go cook, make it Irie, measure twice...",
  },
  {
    id: "avoid",
    label: "Avoid",
    question: "What should the AI never sound like?",
    placeholder: "Example: no corporate buzzwords, no fake hype, no em dashes, no guru voice...",
  },
  {
    id: "stories",
    label: "Stories",
    question: "What kinds of stories or examples do you like using?",
    placeholder: "Example: building in public, customer conversations, lessons from training, family/business moments...",
  },
];

const EXTRA_MARKER = "## Extra Notes";

export function StackEditor({
  initialName,
  initialVoiceNotes,
  updatedAt,
}: {
  initialName: string;
  initialVoiceNotes: string;
  updatedAt: string | null;
}) {
  const parsed = useMemo(() => parseVoiceNotes(initialVoiceNotes), [initialVoiceNotes]);
  const [name, setName] = useState(initialName);
  const [answers, setAnswers] = useState<Record<string, string>>(parsed.answers);
  const [extraNotes, setExtraNotes] = useState(parsed.extraNotes);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(updatedAt);

  const activeQuestion = QUESTIONS[activeIndex];
  const activeQuestionId = `voice-question-${activeQuestion.id}`;
  const answeredCount = QUESTIONS.filter((question) => answers[question.id]?.trim()).length;
  const voiceNotes = compileVoiceNotes(answers, extraNotes);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  function updateAnswer(value: string) {
    setAnswers((current) => ({ ...current, [activeQuestion.id]: value }));
    setStatus("idle");
  }

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
        throw new Error(body.error ?? "Couldn't save your voice.");
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
      <section className="rounded-md border border-border bg-bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-deep">
              Question {activeIndex + 1} of {QUESTIONS.length}
            </p>
            <h2 id={activeQuestionId} className="mt-2 text-xl font-semibold text-text-primary">
              {activeQuestion.question}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Answer naturally. Short, messy, and honest is better than polished.
            </p>
          </div>
          <div className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-secondary">
            {answeredCount}/{QUESTIONS.length} answered
          </div>
        </div>

        <textarea
          aria-labelledby={activeQuestionId}
          value={answers[activeQuestion.id] ?? ""}
          onChange={(event) => updateAnswer(event.target.value)}
          rows={7}
          maxLength={2500}
          placeholder={activeQuestion.placeholder}
          className="mt-5 w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card transition-colors placeholder:text-text-muted focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {QUESTIONS.map((question, index) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={index === activeIndex}
                className={`min-h-11 rounded-md border px-3 text-sm font-medium transition-colors ${
                  index === activeIndex
                    ? "border-border-strong bg-bg-active text-text-primary"
                    : answers[question.id]?.trim()
                      ? "border-border bg-bg-elevated text-text-primary hover:bg-bg-hover"
                      : "border-border bg-bg-surface text-text-secondary hover:bg-bg-hover"
                }`}
              >
                {question.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              disabled={activeIndex === 0}
              className="h-10 rounded-md border border-border bg-bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((index) => Math.min(QUESTIONS.length - 1, index + 1))
              }
              disabled={activeIndex === QUESTIONS.length - 1}
              className="h-10 rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-bg-surface p-5 shadow-card">
        <label
          htmlFor="extra-notes"
          className="block text-sm font-medium text-text-primary"
        >
          Anything else the AI should know?
        </label>
        <p className="mt-1 text-sm text-text-secondary">
          Drop extra examples, rules, or writing samples here.
        </p>
        <textarea
          id="extra-notes"
          rows={6}
          value={extraNotes}
          onChange={(event) => {
            setExtraNotes(event.target.value);
            setStatus("idle");
          }}
          maxLength={8000}
          placeholder="Paste a few posts you like, phrases you use, or anything that did not fit above."
          className="mt-4 w-full resize-y rounded-md border border-border bg-bg-surface px-4 py-3 text-[15px] leading-[1.6] text-text-primary shadow-card transition-colors placeholder:text-text-muted focus:border-accent"
        />
      </section>

      <div className="rounded-md border border-border-subtle bg-bg-elevated p-4">
        <label
          htmlFor="stack-name"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          Voice profile name
        </label>
        <input
          id="stack-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          className="h-12 w-full max-w-md rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary shadow-card transition-colors focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="h-12 rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : "Save my voice"}
        </button>
        {status === "saved" && (
          <span role="status" aria-live="polite" className="text-sm text-success">
            Saved.
          </span>
        )}
        {status === "error" && error && (
          <span role="alert" className="text-sm text-destructive">
            {error}
          </span>
        )}
        {lastSavedAt && status === "idle" && (
          <span className="text-xs text-text-muted">
            Last saved {new Date(lastSavedAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function compileVoiceNotes(answers: Record<string, string>, extraNotes: string) {
  const sections = QUESTIONS.map((question) => {
    const answer = answers[question.id]?.trim();
    return `## ${question.label}\n${answer || "Not answered yet."}`;
  });

  if (extraNotes.trim()) {
    sections.push(`${EXTRA_MARKER}\n${extraNotes.trim()}`);
  }

  return sections.join("\n\n").slice(0, 20000);
}

function parseVoiceNotes(value: string) {
  const answers: Record<string, string> = {};
  let extraNotes = "";

  for (const question of QUESTIONS) {
    const pattern = new RegExp(
      `## ${escapeRegex(question.label)}\\n([\\s\\S]*?)(?=\\n\\n## |$)`
    );
    const match = value.match(pattern);
    answers[question.id] = match?.[1]?.trim() ?? "";
  }

  const extraMatch = value.match(new RegExp(`${escapeRegex(EXTRA_MARKER)}\\n([\\s\\S]*)$`));
  extraNotes = extraMatch?.[1]?.trim() ?? "";

  if (!Object.values(answers).some(Boolean) && value.trim()) {
    extraNotes = value.trim();
  }

  return { answers, extraNotes };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
