// One source → multiple voices. Show, don't card-ify.

const source = `Tuesday voice memo · 47 sec

three years building solo taught me one thing —
the work that compounds isn't the work that's
loudest. it's the work that's consistent. showing
up tuesday after tuesday even when nobody's
watching is the whole job.`;

const outputs = [
  {
    platform: "LinkedIn",
    body:
      "Three years building solo taught me one thing: the work that compounds isn't the work that's loudest. It's the work that's consistent. Showing up Tuesday after Tuesday — even when nobody's watching — is the whole job.",
  },
  {
    platform: "X",
    body:
      "the work that compounds isn't loud. it's consistent. tuesday after tuesday, even when nobody's watching.",
  },
  {
    platform: "Threads",
    body:
      "Solo thing nobody tells you: the most valuable habit isn't 'go viral.' It's the small Tuesday post nobody applauds. That's the reps. That's where the trust gets built.",
  },
  {
    platform: "Newsletter",
    body:
      "There's a thing nobody tells you about three years in: the work that actually compounds is the work nobody applauds. Tuesday morning. No audience. Posting anyway. That's the part that builds something.",
  },
];

export function Transformation() {
  return (
    <section className="container-shell py-24 sm:py-32">
      <div className="mb-16 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
          One in. Many out.
        </p>
        <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-text-primary">
          Same idea.
          <br />
          Four mouths.
        </h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Source — left, mono, raw */}
        <div className="lg:col-span-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Source
          </p>
          <pre className="whitespace-pre-wrap rounded-lg bg-text-primary p-6 font-mono text-[13px] leading-[1.7] text-bg-marketing">
            {source}
          </pre>
          <div className="mt-6 flex items-center gap-3">
            <Arrow />
            <p className="text-sm text-text-muted">
              ~12 seconds later
            </p>
          </div>
        </div>

        {/* Outputs — right, stacked, no cards in a row */}
        <div className="lg:col-span-7 space-y-6">
          {outputs.map((o, i) => (
            <article
              key={o.platform}
              className="border-t border-border-subtle pt-5 first:border-t-0 first:pt-0"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <header className="mb-3 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  {o.platform}
                </span>
                <span
                  aria-hidden="true"
                  className="block h-px flex-1 bg-border-subtle"
                />
                <span className="text-[11px] text-text-muted">
                  {o.body.length} chars
                </span>
              </header>
              <p className="text-[15px] leading-[1.65] text-text-primary">
                {o.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      width="32"
      height="14"
      viewBox="0 0 32 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-accent-deep"
    >
      <path d="M0 7h30M24 1l6 6-6 6" />
    </svg>
  );
}
