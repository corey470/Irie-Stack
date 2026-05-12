"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "magic" | "password";
type Status = "idle" | "submitting" | "sent" | "error";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "submitting") return;

    setStatus("submitting");
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });

    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    setStatus("sent");
  }

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password || status === "submitting") return;

    setStatus("submitting");
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  async function onGoogle() {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });
    if (err) setError(err.message);
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg bg-bg-surface p-8 shadow-card text-center"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Check your email.
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
          We sent a sign-in link to{" "}
          <span className="font-medium text-text-primary">{email}</span>. Click
          it from the same browser.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMode("password");
            setError(null);
          }}
          className="mt-4 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Use password instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mode === "password" ? (
        <form onSubmit={onPassword} className="space-y-3" noValidate>
          <Field
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            disabled={status === "submitting"}
            placeholder="you@yourdomain.com"
          />
          <Field
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={status === "submitting"}
            placeholder="Your password"
          />
          <button
            type="submit"
            disabled={status === "submitting" || !email || !password}
            className="h-12 w-full rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60"
          >
            {status === "submitting" ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onMagicLink} className="space-y-3" noValidate>
          <Field
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            disabled={status === "submitting"}
            placeholder="you@yourdomain.com"
          />
          <button
            type="submit"
            disabled={status === "submitting" || !email}
            className="h-12 w-full rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "password" ? "magic" : "password"));
          setError(null);
        }}
        className="block w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {mode === "password"
          ? "Use a magic link instead"
          : "Use a password instead"}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs uppercase tracking-wider text-text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        className="h-12 w-full rounded-md border border-border bg-bg-surface px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-bg-hover hover:border-border-hover inline-flex items-center justify-center gap-2.5"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {error && (
        <p role="alert" className="text-sm text-destructive text-center">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text-primary mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 w-full rounded-md border border-border bg-bg-surface px-4 text-[16px] text-text-primary placeholder:text-text-muted shadow-card transition-colors focus:border-accent disabled:opacity-60"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
