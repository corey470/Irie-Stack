// Sample generated posts — illustrate what the system outputs.
// Per DESIGN.md: editorial treatment, no platform UI simulation.
// Each card is a clean preview with a small platform chip header.

const samples = [
  {
    platform: "LinkedIn",
    color: "#0a66c2",
    body: "Three years building solo taught me one thing: the work that compounds isn't the work that's loudest. It's the work that's consistent. Showing up Tuesday after Tuesday — even when nobody's watching — is the whole job.",
    chars: 274,
  },
  {
    platform: "X",
    color: "#000000",
    body: "the work that compounds isn't loud. it's consistent. tuesday after tuesday, even when nobody's watching.",
    chars: 105,
  },
  {
    platform: "Threads",
    color: "#000000",
    body: "Solo thing nobody tells you: the most valuable habit isn't 'go viral.' It's the small Tuesday post nobody applauds. That's the reps. That's where the trust gets built.",
    chars: 167,
  },
];

export function SamplePosts() {
  return (
    <section className="container-shell pb-20 sm:pb-28">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
          One idea in
        </p>
        <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] leading-tight text-text-primary">
          Three platforms out — and it sounds like you on every one.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {samples.map((s) => (
          <article
            key={s.platform}
            className="rounded-lg bg-bg-surface p-6 shadow-card transition-shadow duration-150 hover:shadow-card-hover"
          >
            <header className="mb-4 flex items-center gap-2">
              <PlatformDot color={s.color} />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {s.platform}
              </span>
            </header>
            <p className="text-[15px] leading-[1.6] text-text-primary">
              {s.body}
            </p>
            <footer className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
              <span className="text-xs text-text-muted">
                {s.chars} chars
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-1.5 rounded-full bg-success"
                />
                Approved
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlatformDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
