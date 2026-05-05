import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { Transformation } from "@/components/transformation";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-marketing">
      <Header />
      <Hero />
      <Manifesto />
      <MonthSystem />
      <Transformation />
      <Stack />
      <Waitlist />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="bg-[#080808]">
      <div className="container-shell flex items-center justify-between pt-5 sm:pt-7">
      <Link
        href="/"
        className="font-display text-[clamp(1.25rem,2vw,1.5rem)] tracking-tight text-[#f2ede4]"
      >
        IrieStack
      </Link>
      <div className="flex items-center gap-2 sm:gap-7">
        <Link
          href="/login"
          className="inline-flex h-11 items-center px-1 text-sm font-medium text-[#f2ede4]/65 transition-colors hover:text-[#f2ede4]"
        >
          Sign in
        </Link>
        <Link
          href="#waitlist"
          className="inline-flex h-11 items-center rounded-md bg-accent px-3 text-[13px] font-medium text-[#080808] transition-colors hover:bg-accent-light sm:px-4"
        >
          Get early access
        </Link>
      </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#080808] pb-12 pt-10 text-[#f2ede4] sm:pb-16 sm:pt-14 lg:min-h-[820px] lg:pb-14 lg:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-10 xl:gap-14">
        <div>
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-accent-light">
            Content engine for operators
          </p>
          <h1 className="font-display text-[clamp(2.85rem,12vw,6.7rem)] leading-[0.9] text-[#fafaf7] sm:leading-[0.88]">
            30 days of
            <br />
            <span className="text-accent-light">social posts,</span>
            <br />
            handled.
          </h1>
          <div className="mt-7 max-w-xl space-y-4 text-[clamp(1.0625rem,1.45vw,1.2rem)] leading-[1.55] text-[#f2ede4]/72">
            <p>
              Give IrieStack one messy idea, voice memo, blog draft, or campaign
              angle. It turns that into a full month of Facebook, Instagram,
              LinkedIn, X, TikTok, and newsletter content.
            </p>
            <p>
              It writes the posts, gives each one an image brief, lays everything
              on a calendar, routes approvals, and moves clean pieces into the
              posting queue.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a
              href="#waitlist"
              className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-semibold text-[#080808] shadow-gold-glow transition-all hover:bg-accent-light"
            >
              Build my month
            </a>
            <p className="text-sm text-[#f2ede4]/55">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-success align-middle" />
              Approve it, edit it, or let it run.
            </p>
          </div>
          <div className="mt-5 grid max-w-xl grid-cols-5 gap-1.5 sm:mt-6 sm:gap-2">
            {["Idea", "Posts", "Images", "Calendar", "Queue"].map(
              (label, index) => (
                <div
                  key={label}
                  className="hero-flow-step rounded-md border border-accent/20 bg-[#f2ede4]/[0.06] px-2 py-2 text-[11px] font-medium text-[#f2ede4]/78 sm:px-3 sm:text-xs"
                  style={{ animationDelay: `${index * 420}ms` }}
                >
                  <span className="mb-1 block h-1 w-5 rounded-full bg-accent" />
                  {label}
                </div>
              ),
            )}
          </div>
          <div className="mt-8 hidden max-w-xl grid-cols-2 gap-2 sm:grid sm:grid-cols-4 sm:gap-3">
            <HeroMetric value="1" label="source" />
            <HeroMetric value="34" label="posts" />
            <HeroMetric value="30" label="days" />
            <HeroMetric value="6" label="channels" />
          </div>
        </div>

        <div>
          <HeroMachine />
        </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-accent/20 bg-[#f2ede4]/[0.07] px-3 py-3 shadow-card backdrop-blur">
      <div className="font-display text-2xl leading-none text-[#fafaf7]">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#f2ede4]/56">
        {label}
      </div>
    </div>
  );
}

const HERO_POSTS = [
  {
    platform: "LinkedIn",
    chars: 612,
    status: "Approved",
    tone: "long post",
    body:
      "Most businesses do not need more random posting. They need a system that turns real expertise into reminders, proof, stories, and offers that show up all month.",
  },
  {
    platform: "Instagram",
    chars: 286,
    status: "Needs image",
    tone: "single",
    body:
      "Visual brief: clean founder photo, one hard truth in large type, product proof in the second slide. Make it feel handled, not hyped.",
  },
  {
    platform: "X",
    chars: 214,
    status: "Approved",
    tone: "sharp",
    body:
      "posting gets easier when the system stops asking you to be inspired on command. source in. calendar out. approve what is clean. fix what needs love.",
  },
  {
    platform: "Facebook",
    chars: 480,
    status: "Scheduled",
    tone: "story post",
    body:
      "The customer does not need another reminder to book. They need to feel the cost of waiting until the morning everything goes sideways.",
  },
  {
    platform: "TikTok",
    chars: 338,
    status: "Ready",
    tone: "caption seed",
    body:
      "Talking-head hook: \"If your business depends on trust, your social media cannot feel random.\" Cut to calendar, post cards, approval queue, and the final delivery receipt.",
  },
  {
    platform: "Newsletter",
    chars: 742,
    status: "Drafted",
    tone: "note",
    body:
      "A short founder note becomes the weekly anchor. The smaller posts carry the sharp pieces from it, so everything points back to one real idea.",
  },
];

function HeroMachine() {
  return (
    <div className="hero-stage relative mx-auto w-full max-w-[900px]">
      <div className="relative overflow-hidden rounded-lg border border-accent/20 bg-[#10100f] p-2 shadow-[0_36px_120px_-40px_rgba(0,0,0,0.9)]">
        <div className="hero-scanline" aria-hidden="true" />
        <div className="rounded-md border border-[#f2ede4]/10 bg-[#151412] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#f2ede4]/10 pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent-light">
                Live content run
              </p>
              <p className="mt-1 text-sm font-semibold text-[#fafaf7]">
                Owner-operator campaign
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs text-[#cef7da] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Calendar building
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[0.72fr_1.08fr_0.62fr]">
            <div className="space-y-3">
              <div className="hero-source-card rounded-md border border-[#f2ede4]/10 bg-[#0c0c0b] p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#f2ede4]/48">
                    Source
                  </span>
                  <span className="rounded-full bg-accent/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-accent-light">
                    voice
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#f2ede4]/85 sm:text-[15px]">
                  "I want a campaign about why a local owner-operated ride is
                  smarter than gambling on Uber at 5 AM."
                </p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#f2ede4]/10">
                  <div className="hero-progress h-full rounded-full bg-accent" />
                </div>
              </div>

              <div className="hero-recipe-card hidden rounded-md border border-[#f2ede4]/10 bg-[#0c0c0b] p-3 sm:block">
                <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#f2ede4]/48">
                  <span>Content recipe</span>
                  <span>34 pieces</span>
                </div>
                <div className="space-y-2">
                  {[
                    ["Blog anchor", "done"],
                    ["Facebook", "8"],
                    ["Instagram", "8"],
                    ["X", "10"],
                    ["TikTok", "4"],
                    ["Newsletter", "4"],
                  ].map(([label, value], index) => (
                    <div
                      key={index}
                      className="hero-recipe-row flex items-center justify-between border-b border-[#f2ede4]/[0.08] pb-2 text-[13px]"
                      style={{ animationDelay: `${index * 220}ms` }}
                    >
                      <span className="text-[#f2ede4]/65">{label}</span>
                      <span className="font-medium text-accent-light">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-calendar-panel relative min-h-[340px] overflow-hidden rounded-md border border-[#f2ede4]/10 bg-[#f7f4ee] p-3 text-[#1a1a1a] sm:min-h-[470px]">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-text-muted">
                <span>30-day social calendar</span>
                <span>May 2026</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
                {Array.from({ length: 35 }).map((_, index) => {
                  const hasPost = index % 2 === 0 || index % 7 === 3;
                  return (
                    <div
                      key={index}
                      className={`hero-calendar-cell min-h-12 rounded-sm border border-[#ded6c8] bg-white p-1.5 sm:min-h-16 sm:p-2 ${
                        hasPost ? "has-post" : ""
                      }`}
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-text-muted">
                          {index + 1}
                        </span>
                        {hasPost && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </div>
                      {hasPost && (
                        <div className="mt-2 space-y-1">
                          <span className="block h-2 rounded-full bg-[#1a1a1a]/75" />
                          <span className="block h-2 w-2/3 rounded-full bg-accent/70" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hero-focus-deck pointer-events-none absolute inset-x-4 bottom-4 h-[178px] sm:inset-x-5 sm:bottom-5 sm:h-[220px]">
                {HERO_POSTS.map((post, index) => (
                  <PostCard
                    key={post.platform}
                    platform={post.platform}
                    chars={post.chars}
                    body={post.body}
                    status={post.status}
                    tone={post.tone}
                    className={`hero-focus-card hero-focus-card-${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="rounded-md border border-[#f2ede4]/10 bg-[#0c0c0b] p-3">
                <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-accent-light">
                  Agents
                </p>
                {["Drafted", "Image needed", "Approved", "Queued"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className="hero-agent-row mb-2 flex items-center justify-between rounded-sm bg-[#f2ede4]/[0.07] px-2.5 py-2.5 text-xs text-[#f2ede4]/72"
                      style={{ animationDelay: `${index * 360}ms` }}
                    >
                      <span>{label}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    </div>
                  ),
                )}
              </div>
              <div className="rounded-md border border-accent/25 bg-accent/10 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent-light">
                  Receipt
                </p>
                <p className="mt-2 font-display text-3xl leading-none text-[#fafaf7]">
                  30
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#f2ede4]/65">
                  days of posts planned, briefed, and ready to approve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs italic leading-relaxed text-[#f2ede4]/48">
        One messy thought becomes platform-native posts, image briefs, a
        30-day calendar, approvals, and a posting queue.
      </p>
    </div>
  );
}

function PostCard({
  platform,
  body,
  chars,
  status = "Approved",
  tone,
  className = "",
}: {
  platform: string;
  body: string;
  chars: number;
  status?: string;
  tone?: string;
  className?: string;
}) {
  return (
    <article
      className={`rounded-md bg-bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover ${className}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`block h-2 w-2 rounded-full ${platformDot(platform)}`}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
            {platform}
          </span>
        </span>
        {tone && (
          <span className="rounded-sm bg-bg-elevated px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-text-muted">
            {tone}
          </span>
        )}
      </header>
      <p className="text-[15px] leading-[1.6] text-text-primary">{body}</p>
      <footer className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
        <span className="text-xs text-text-muted">{chars} chars</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
          <span
            aria-hidden="true"
            className={`block h-1.5 w-1.5 rounded-full ${
              status === "Needs image" ? "bg-warning" : "bg-success"
            }`}
          />
          {status}
        </span>
      </footer>
    </article>
  );
}

function platformDot(platform: string) {
  if (platform === "LinkedIn") return "bg-info";
  if (platform === "Instagram") return "bg-accent";
  if (platform === "TikTok") return "bg-text-primary";
  return "bg-text-primary";
}

function Manifesto() {
  return (
    <section className="border-y border-accent/15 bg-[#11100e] text-[#f2ede4]">
      <div className="container-shell py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-accent-light">
              The real problem
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4.4rem)] leading-[0.98] text-[#fafaf7]">
              Posting breaks because the blank page comes back every day.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[clamp(1.05rem,1.45vw,1.22rem)] leading-relaxed text-[#f2ede4]/72">
              Most tools forget who you are between sessions. IrieStack starts
              with your Context Stack: what you sell, who you serve, what you
              believe, how you talk, and what you never want to sound like.
            </p>
            <p className="mt-5 text-[clamp(1rem,1.3vw,1.1rem)] leading-relaxed text-[#f2ede4]/62">
              Then every campaign uses that same root profile, so the posts feel
              like they came from you instead of from a template.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          <ProblemTile
            label="No more guessing"
            body="The system helps turn a rough thought into a campaign angle before it writes the month."
          />
          <ProblemTile
            label="No more scattered drafts"
            body="Posts, image prompts, approvals, and timing live in one 30-day run."
          />
          <ProblemTile
            label="No more copy-paste chore"
            body="Clean posts move from review into the queue that posting agents can carry."
          />
        </div>

        <div className="mt-10">
          <a
            href="#waitlist"
            className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-semibold text-[#080808] transition-colors hover:bg-accent-light"
          >
            Get in before the next build wave
          </a>
        </div>
      </div>
    </section>
  );
}

function ProblemTile({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-accent/18 bg-[#f2ede4]/[0.06] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-light">
        {label}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[#f2ede4]/68">
        {body}
      </p>
    </div>
  );
}

function MonthSystem() {
  const items = [
    {
      title: "Campaign source",
      body:
        "Start with a topic, URL, voice memo, blog draft, or messy note. IrieStack turns it into a usable source draft.",
    },
    {
      title: "Platform-native posts",
      body:
        "Facebook reads like Facebook. X stays sharp. LinkedIn gets depth. Instagram and TikTok get captions built for visuals.",
    },
    {
      title: "Image direction",
      body:
        "Every post that needs a visual gets a plain-language image brief, so the operator knows exactly what to make or upload.",
    },
    {
      title: "30-day calendar",
      body:
        "The month is laid out by date, channel, and posting time so the run looks real before anything goes live.",
    },
    {
      title: "Approval control",
      body:
        "Approve one post, a day, a week, or the whole month. Keep sensitive channels manual and trusted channels on autopilot.",
    },
    {
      title: "Posting queue",
      body:
        "Approved posts move into the queue with receipts, issues, and status so you know what is waiting, posted, or needs love.",
    },
  ];

  return (
    <section className="bg-bg-marketing">
      <div className="container-shell py-16 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
              What the month includes
            </p>
            <h2 className="font-display text-[clamp(2rem,4.4vw,3.8rem)] leading-[1.02] text-text-primary">
              This is not one post. It is the whole run.
            </h2>
            <p className="mt-5 text-[clamp(1rem,1.35vw,1.1rem)] leading-relaxed text-text-secondary">
              The point is not to help someone write today. The point is to make
              tomorrow, next week, and the end of the month feel handled before
              they leave the screen.
            </p>
            <a
              href="#waitlist"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-md border border-accent-deep px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-accent"
            >
              I want this workflow
            </a>
          </div>
          <div className="lg:col-span-8">
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-md border border-border bg-bg-surface p-5 shadow-card"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section className="bg-[#080808] text-[#f2ede4]">
      <div className="container-shell py-16 sm:py-28">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-light">
            Approval, on your terms
          </p>
          <h2 className="font-display text-[clamp(2rem,4.6vw,3.9rem)] leading-[1.03] tracking-tight text-[#fafaf7]">
            Keep control where it matters.
            <br />
            Let the rest move.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#f2ede4]/64">
            Early adopters should feel the safety: nothing has to go live
            without approval. But once a channel earns trust, it can run.
          </p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6 space-y-5">
          <ChannelRow platform="LinkedIn" mode="autopilot" />
          <ChannelRow platform="X" mode="autopilot" />
          <ChannelRow platform="Threads" mode="review" />
          <ChannelRow platform="Instagram" mode="review" />
          <ChannelRow platform="Newsletter" mode="review" />
          <p className="pt-4 text-[15px] leading-relaxed text-[#f2ede4]/64 max-w-xl">
            Maybe you trust LinkedIn on autopilot but want eyes on Instagram.
            Maybe the opposite. Toggle any channel any week — the system
            doesn't fight you.
          </p>
          <a
            href="#waitlist"
            className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-[#080808] transition-colors hover:bg-accent-light"
          >
            Join as an early adopter
          </a>
        </div>
      </div>
      </div>
    </section>
  );
}

function ChannelRow({
  platform,
  mode,
}: {
  platform: string;
  mode: "autopilot" | "review";
}) {
  const on = mode === "autopilot";
  return (
    <div className="flex items-center justify-between border-b border-[#f2ede4]/12 pb-5">
      <div>
        <p className="text-[15px] font-medium text-[#fafaf7]">{platform}</p>
        <p className="mt-0.5 text-sm text-[#f2ede4]/52">
          {on ? "Posts ship automatically" : "Posts wait for your approval"}
        </p>
      </div>
      <div
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          on ? "bg-accent" : "bg-[#f2ede4]/18"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute h-5 w-5 rounded-full bg-[#fafaf7] shadow-card transition-transform ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}

function Waitlist() {
  return (
    <section
      id="waitlist"
      className="border-t border-accent/20 bg-bg-marketing-deep"
    >
      <div className="container-shell py-16 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
              Early adopter access
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-text-primary">
              Get your first month built
              <br />
              while the stack is still close.
            </h2>
            <p className="mt-6 max-w-lg text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
              Drop your email if you want to be one of the first operators
              testing the real workflow: source in, 30-day calendar out,
              approvals ready, posting queue waiting.
            </p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              <WaitlistProof value="30 days" label="planned in one run" />
              <WaitlistProof value="6 channels" label="built from one source" />
              <WaitlistProof value="you decide" label="approval or autopilot" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function WaitlistProof({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-surface p-4 shadow-card">
      <p className="font-display text-2xl leading-none text-text-primary">
        {value}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-bg-marketing">
      <div className="container-shell flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-10">
        <p className="font-display text-base text-text-primary">IrieStack</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-text-muted">
          <span>© {new Date().getFullYear()}</span>
          <span className="hidden sm:inline">·</span>
          <span>Part of the Irie ecosystem</span>
          <span className="hidden sm:inline">·</span>
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
