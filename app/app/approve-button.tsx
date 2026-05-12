"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Scope = {
  runId?: string;
  pieceId?: string;
  day?: string;
};

export function ApproveButton({
  scope,
  children,
  variant = "primary",
}: {
  scope: Scope;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function approve() {
    if (status === "working") return;
    if (requiresConfirmation(scope)) {
      const confirmed = window.confirm(
        scope.day
          ? "Approve every ready post for this day? Posts that still need images or fixes will stay blocked."
          : "Approve every ready post in this plan? Posts that still need images or fixes will stay blocked."
      );
      if (!confirmed) return;
    }
    setStatus("working");
    setMessage(null);

    try {
      const response = await fetch("/api/approvals/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(scope),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not approve posts.");

      const blocked = body.blocked ? ` ${body.blocked} still need images or fixes.` : "";
      setMessage(`Nice, ${body.approved} approved.${blocked}`);
      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not approve posts.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={status === "working"}
        className={`min-h-11 rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
          variant === "primary"
            ? "bg-accent text-text-primary hover:bg-accent/80"
            : "border border-border-strong bg-bg-surface text-text-primary hover:bg-bg-hover"
        }`}
      >
        {status === "working" ? "Approving..." : children}
      </button>
      {message && (
        <span
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`text-xs ${
            status === "error" ? "text-destructive" : "text-text-secondary"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}

function requiresConfirmation(scope: Scope) {
  return Boolean(scope.runId || scope.day);
}
