"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "submitting") return;

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't add you to the list. Try again?");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something didn't work.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg bg-bg-surface p-6 shadow-card text-left"
      >
        <p className="font-medium text-text-primary">You're on the list.</p>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
          We'll email you when there's a spot. No drip campaign. No noise.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col sm:flex-row gap-3 text-left"
      noValidate
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@yourdomain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "submitting"}
        className="h-12 flex-1 rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary placeholder:text-text-muted shadow-card transition-colors duration-150 focus:border-accent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "submitting" || !email}
        className="h-12 rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all duration-150 hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60 disabled:hover:bg-accent disabled:hover:shadow-card"
      >
        {status === "submitting" ? "Adding…" : "Join"}
      </button>
      {error && (
        <p
          role="alert"
          className="basis-full text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  );
}
