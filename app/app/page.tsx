import Link from "next/link";

export default function AppHome() {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
        Welcome
      </p>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
        Your stack is empty.
      </h1>
      <p className="mt-4 text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
        Let's build it. A short chat — about ten minutes — captures how you
        actually talk. After that, the system writes the way you do.
      </p>

      <div className="mt-10">
        <Link
          href="/onboarding"
          className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all duration-150 hover:bg-accent-light hover:shadow-card-hover animate-cta-pulse"
        >
          Start onboarding
        </Link>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        <PlaceholderCard
          n="01"
          title="Train it once"
          body="The Context Stack — a living asset captured in one conversation."
        />
        <PlaceholderCard
          n="02"
          title="Generate the week"
          body="20+ platform-native posts from a single source idea."
        />
        <PlaceholderCard
          n="03"
          title="Approve, or autopilot"
          body="Per channel. Switch any time. Telegram bot included."
        />
        <PlaceholderCard
          n="04"
          title="Watch it sharpen"
          body="The system gets better with every approval, every reject, every edit."
        />
      </div>
    </div>
  );
}

function PlaceholderCard({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg bg-bg-surface p-5 shadow-card">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 font-display text-sm text-accent-deep">
        {n}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
        {body}
      </p>
    </div>
  );
}
