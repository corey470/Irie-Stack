import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app", icon: DashboardIcon },
  { label: "Stack", href: "/app/stack", icon: StackIcon },
  { label: "Generate", href: "/app/generate", icon: GenerateIcon },
  { label: "Review", href: "/app", icon: ReviewIcon, disabled: true },
  { label: "Settings", href: "/app", icon: SettingsIcon, disabled: true },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isTestBypass } = await getAppContext();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-bg-primary">
      <aside className="hidden md:flex md:w-[248px] fixed inset-y-0 left-0 flex-col bg-bg-sidebar shadow-sidebar">
        <div className="px-6 py-6">
          <Link
            href="/app"
            className="font-display text-xl tracking-tight text-text-primary"
          >
            IrieStack
          </Link>
        </div>
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.disabled ? (
                  <span
                    aria-disabled="true"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted cursor-not-allowed"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-text-faint">
                      Soon
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-primary bg-bg-hover transition-colors duration-150"
                  >
                    <item.icon active />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border-subtle px-3 py-4">
          <div className="px-3 py-2 text-xs text-text-muted truncate">
            {isTestBypass ? `Testing as ${user.email}` : user.email}
          </div>
          {!isTestBypass && <SignOutButton />}
        </div>
      </aside>

      <div className="md:pl-[248px]">
        <header className="md:hidden flex items-center justify-between bg-bg-surface px-4 py-3 shadow-topbar">
          <Link
            href="/app"
            className="font-display text-lg tracking-tight text-text-primary"
          >
            IrieStack
          </Link>
          {!isTestBypass && <SignOutButton compact />}
        </header>
        <main className="container-shell py-8 sm:py-12">{children}</main>
      </div>
    </div>
  );
}

// Icons — generic outline shapes (NOT brand glyphs). Stroke 1.5, 20px.
function DashboardIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#c9a84c" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
function StackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M2 13l10 5 10-5" />
      <path d="M2 18l10 5 10-5" />
    </svg>
  );
}
function GenerateIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M19 17v4" />
      <path d="M17 19h4" />
      <path d="M11 3l2.5 6.5L20 12l-6.5 2.5L11 21l-2.5-6.5L2 12l6.5-2.5L11 3Z" />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 5h13" />
      <path d="M3 12h13" />
      <path d="M3 19h7" />
      <path d="m16 16 2 2 4-4" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
