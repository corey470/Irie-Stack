"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavItemLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    href === "/app"
      ? pathname === "/app"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-bg-surface text-text-primary shadow-card"
          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 h-6 w-0.5 rounded-r-full bg-accent"
        />
      )}
      <span className={active ? "text-accent-deep" : "text-text-secondary"}>
        {children}
      </span>
      <span>{label}</span>
    </Link>
  );
}
