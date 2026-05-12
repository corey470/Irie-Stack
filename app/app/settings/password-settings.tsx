"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "saving" | "saved" | "error";

export function PasswordSettings() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;

    if (password.length < 8) {
      setStatus("error");
      setMessage("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Both password fields need to match.");
      return;
    }

    setStatus("saving");
    setMessage(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setStatus("error");
      setMessage(
        "This testing session is bypassing login, so there is no password session to update. Sign in with email and password first, then change it here."
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setStatus("saved");
    setMessage("Password updated.");
  }

  return (
    <section className="rounded-md border border-border bg-bg-surface p-4 shadow-card">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">
        Login
      </p>
      <h2 className="text-base font-semibold text-text-primary">
        Change password
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
        Set a new password for this account. Google sign-in can come later; this
        gives email/password users a normal way back in.
      </p>

      <form onSubmit={updatePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="new-password"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setStatus("idle");
              setMessage(null);
            }}
            className="h-11 w-full rounded-md border border-border bg-bg-surface px-3 text-[15px] text-text-primary shadow-card focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setStatus("idle");
              setMessage(null);
            }}
            className="h-11 w-full rounded-md border border-border bg-bg-surface px-3 text-[15px] text-text-primary shadow-card focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={status === "saving" || !password || !confirmPassword}
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-accent-light disabled:opacity-60"
          >
            {status === "saving" ? "Saving" : "Save password"}
          </button>
          {message && (
            <span
              role={status === "error" ? "alert" : "status"}
              className={`text-sm ${
                status === "error" ? "text-destructive" : "text-success"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
