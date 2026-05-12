import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "./mobile-nav";
import { NavItemLink } from "./nav-item-link";

type NavItem = {
  label: string;
  href: string;
  icon: (props: { active?: boolean }) => React.ReactNode;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Today", href: "/app", icon: DashboardIcon },
  { label: "Content Fuel", href: "/app/research", icon: ResearchIcon },
  { label: "Create Plan", href: "/app/generate", icon: GenerateIcon },
  { label: "Plan Calendar", href: "/app/runs", icon: RunsIcon },
  { label: "Review Inbox", href: "/app/queue", icon: ReviewIcon },
  { label: "Delivery Queue", href: "/app/relay", icon: RelayIcon },
  { label: "Setup", href: "/onboarding", icon: OnboardingIcon },
  { label: "Your Voice", href: "/app/stack", icon: StackIcon },
  { label: "Settings", href: "/app/settings", icon: SettingsIcon },
];

const NAV_GROUPS = [
  {
    label: "Build",
    items: NAV_ITEMS.slice(0, 4),
  },
  {
    label: "Operate",
    items: NAV_ITEMS.slice(4, 6),
  },
  {
    label: "Configure",
    items: NAV_ITEMS.slice(6),
  },
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-text-primary focus:shadow-modal"
      >
        Skip to main content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col bg-bg-sidebar shadow-sidebar md:flex">
        <div className="px-5 py-5">
          <Link
            href="/app"
            className="font-display text-xl tracking-tight text-text-primary"
          >
            IrieStack
          </Link>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Content engine cockpit
          </p>
        </div>
        <nav className="flex-1 px-3" aria-label="Primary navigation">
          {NAV_GROUPS.map((group) => (
            <NavGroup key={group.label} label={group.label}>
              {group.items.map((item) => (
                <li key={item.label}>
                  {item.disabled ? (
                    <span className="flex min-h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted">
                      <item.icon />
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    <NavItemLink href={item.href} label={item.label}>
                      <item.icon />
                    </NavItemLink>
                  )}
                </li>
              ))}
            </NavGroup>
          ))}
        </nav>
        <div className="border-t border-border-subtle px-3 py-4">
          <Link
            href="/app/generate"
            className="mb-3 flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-text-primary shadow-card transition-colors hover:bg-accent-light"
          >
            Create plan
          </Link>
          <div className="px-3 py-2 text-xs text-text-muted truncate">
            {isTestBypass ? `Testing as ${user.email}` : user.email}
          </div>
          {!isTestBypass && <SignOutButton />}
        </div>
      </aside>

      <div className="md:pl-[260px]">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-bg-surface px-4 py-3 shadow-topbar">
          <Link
            href="/app"
            className="font-display text-lg tracking-tight text-text-primary"
          >
            IrieStack
          </Link>
          <span className="text-xs font-medium text-text-muted">Cockpit</span>
        </header>
        <MobileNav showSignOut={!isTestBypass} />
        <main id="main-content" className="workspace-shell">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <ul className="space-y-1">{children}</ul>
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
function OnboardingIcon() {
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
      <path d="M5 4h14" />
      <path d="M5 12h14" />
      <path d="M5 20h8" />
      <path d="m15 18 2 2 4-4" />
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
function ResearchIcon() {
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
      <path d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
      <path d="m15 15 5 5" />
      <path d="M7.5 9.5h5" />
      <path d="M10 7v5" />
    </svg>
  );
}
function RunsIcon() {
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
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
      <path d="M7 3v4" />
      <path d="M7 10v4" />
      <path d="M7 17v4" />
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
function RelayIcon() {
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
      <path d="M4 12h12" />
      <path d="m12 6 6 6-6 6" />
      <path d="M4 6h4" />
      <path d="M4 18h4" />
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
