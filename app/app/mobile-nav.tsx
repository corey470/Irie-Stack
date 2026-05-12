"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";

const PRIMARY_ITEMS = [
  { label: "Today", href: "/app" },
  { label: "Build", href: "/app/research" },
  { label: "Calendar", href: "/app/runs" },
  { label: "Approve", href: "/app/queue" },
];

const MENU_GROUPS = [
  {
    label: "Run the month",
    items: [
      { label: "Today", href: "/app", body: "See what needs attention." },
      { label: "Build Month", href: "/app/research", body: "Talk out the idea and build the source." },
      { label: "Calendar", href: "/app/runs", body: "See the 30 days." },
      { label: "Approve", href: "/app/queue", body: "Add images and approve posts." },
      { label: "Publish", href: "/app/relay", body: "Track what is ready, posted, or stuck." },
    ],
  },
  {
    label: "Tune",
    items: [
      { label: "Setup", href: "/onboarding", body: "Build the root profile." },
      { label: "Voice", href: "/app/stack", body: "Tune the writing style." },
      { label: "Settings", href: "/app/settings", body: "Login and accounts." },
    ],
  },
];

export function MobileNav({ showSignOut }: { showSignOut: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-surface/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-topbar backdrop-blur md:hidden"
        aria-label="Mobile primary navigation"
      >
        <div className="grid grid-cols-5 gap-1">
          {PRIMARY_ITEMS.map((item) => (
            <MobileLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(pathname, item.href)}
            />
          ))}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-app-menu"
            aria-label="Open navigation menu"
            className="min-h-12 rounded-md px-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Menu
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-text-primary/20 p-3 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            id="mobile-app-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby={menuTitleId}
            className="flex h-full flex-col rounded-lg bg-bg-surface shadow-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <div>
                <p
                  id={menuTitleId}
                  className="font-display text-lg text-text-primary"
                >
                  IrieStack
                </p>
                <p className="text-xs text-text-muted">Pick the next step.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-md border border-border bg-bg-elevated px-3 text-sm font-medium text-text-primary"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
              <Link
                href="/app/research"
                onClick={() => setOpen(false)}
                className="mb-4 flex min-h-12 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary"
              >
                Build month
              </Link>

              <div className="space-y-5">
                {MENU_GROUPS.map((group) => (
                  <section key={group.label}>
                    <h2 className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-accent-deep">
                      {group.label}
                    </h2>
                    <div className="grid gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`rounded-md border p-3 transition-colors ${
                            isActive(pathname, item.href)
                              ? "border-border-strong bg-bg-active"
                              : "border-border bg-bg-elevated hover:bg-bg-hover"
                          }`}
                        >
                          <div className="text-sm font-semibold text-text-primary">
                            {item.label}
                          </div>
                          <div className="mt-1 text-xs text-text-secondary">
                            {item.body}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              {showSignOut && (
                <div className="mt-5 border-t border-border-subtle pt-4">
                  <SignOutButton />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
        active
          ? "bg-bg-active text-text-primary"
          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  const cleanHref = href.split("?")[0];
  return cleanHref === "/app"
    ? pathname === "/app"
    : pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}
