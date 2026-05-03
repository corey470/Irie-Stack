import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { Transformation } from "@/components/transformation";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-marketing">
      <Header />
      <Hero />
      <Manifesto />
      <Transformation />
      <Stack />
      <Waitlist />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="container-shell flex items-center justify-between pt-6 sm:pt-8">
      <Link
        href="/"
        className="font-display text-[clamp(1.25rem,2vw,1.5rem)] tracking-tight text-text-primary"
      >
        IrieStack
      </Link>
      <div className="flex items-center gap-5 sm:gap-7">
        <Link
          href="/login"
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="#waitlist"
          className="inline-flex h-9 items-center rounded-md bg-text-primary px-4 text-[13px] font-medium text-bg-marketing hover:bg-text-secondary transition-colors"
        >
          Join the list
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="container-shell pt-16 sm:pt-24 lg:pt-32 pb-24 sm:pb-32 lg:pb-40">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left — type-driven */}
        <div className="lg:col-span-7">
          <p className="mb-8 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
            Issue 01 · A note from the maker
          </p>
          <h1 className="font-display text-[clamp(2.75rem,7.5vw,6rem)] leading-[0.98] tracking-[-0.02em] text-text-primary">
            Twenty posts a week.
            <br />
            <span className="text-accent-deep">None of them</span> sound like AI.
          </h1>
          <div className="mt-10 max-w-xl space-y-4 text-[clamp(1.0625rem,1.5vw,1.1875rem)] leading-[1.55] text-text-secondary">
            <p>
              Drop in a podcast clip, a blog draft, a half-formed thought.
              IrieStack rewrites it for every channel — LinkedIn, X, Threads,
              your newsletter — in the way{" "}
              <em className="not-italic font-medium text-text-primary">
                you
              </em>{" "}
              actually talk.
            </p>
            <p>
              You approve them. Or you flip a switch and they ship. Per channel.
              Your call.
            </p>
          </div>
          <div className="mt-12 flex items-center gap-6">
            <a
              href="#waitlist"
              className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all hover:bg-accent-light hover:shadow-card-hover animate-cta-pulse"
            >
              Get on the waitlist
            </a>
            <p className="hidden sm:block text-sm text-text-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success mr-2 align-middle" />
              Letting in 5 a week
            </p>
          </div>
        </div>

        {/* Right — the artifact, asymmetric */}
        <div className="lg:col-span-5 lg:pt-12 relative">
          <PostCard
            platform="LinkedIn"
            chars={274}
            body="Three years building solo taught me one thing: the work that compounds isn't the work that's loudest. It's the work that's consistent. Showing up Tuesday after Tuesday — even when nobody's watching — is the whole job."
            className="relative z-10"
          />
          <PostCard
            platform="X"
            chars={105}
            body="the work that compounds isn't loud. it's consistent. tuesday after tuesday, even when nobody's watching."
            className="mt-6 ml-8 sm:ml-16 lg:ml-12 xl:ml-20 relative z-0 -rotate-[1deg]"
          />
          <p className="mt-8 ml-1 text-xs text-text-muted italic">
            ↑ both written from a single Tuesday voice memo. Same thought.
            Different mouths.
          </p>
        </div>
      </div>
    </section>
  );
}

function PostCard({
  platform,
  body,
  chars,
  className = "",
}: {
  platform: string;
  body: string;
  chars: number;
  className?: string;
}) {
  return (
    <article
      className={`rounded-lg bg-bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover ${className}`}
    >
      <header className="mb-4 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="block h-2 w-2 rounded-full bg-text-primary"
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          {platform}
        </span>
      </header>
      <p className="text-[15px] leading-[1.6] text-text-primary">{body}</p>
      <footer className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
        <span className="text-xs text-text-muted">{chars} chars</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
          <span
            aria-hidden="true"
            className="block h-1.5 w-1.5 rounded-full bg-success"
          />
          Approved
        </span>
      </footer>
    </article>
  );
}

function Manifesto() {
  return (
    <section className="border-y border-border-subtle bg-bg-marketing-deep">
      <div className="container-shell py-24 sm:py-28">
        <div className="max-w-3xl">
          <p className="font-display text-[clamp(1.625rem,3.5vw,2.5rem)] leading-[1.25] text-text-primary">
            <span className="text-accent-deep">Most AI tools forget</span> who
            you are between sessions. We don't. The first ten minutes you spend
            with IrieStack are a chat — not a form, not a survey — about how
            you actually talk. Then we feed that back every time we write for
            you.
          </p>
          <p className="mt-8 text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary max-w-2xl">
            We call it the Context Stack. It's a living asset you own. It gets
            sharper every week from your edits, approvals, and rejects. Three
            months in, it knows your phrasings, your jokes, the one word you
            never use.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section className="container-shell py-24 sm:py-32">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
            Approval, on your terms
          </p>
          <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] leading-[1.1] tracking-tight text-text-primary">
            Trust us per channel.
            <br />
            Not all at once.
          </h2>
        </div>
        <div className="lg:col-span-7 lg:col-start-6 space-y-5">
          <ChannelRow platform="LinkedIn" mode="autopilot" />
          <ChannelRow platform="X" mode="autopilot" />
          <ChannelRow platform="Threads" mode="review" />
          <ChannelRow platform="Instagram" mode="review" />
          <ChannelRow platform="Newsletter" mode="review" />
          <p className="pt-4 text-[15px] leading-relaxed text-text-secondary max-w-xl">
            Maybe you trust LinkedIn on autopilot but want eyes on Instagram.
            Maybe the opposite. Toggle any channel any week — the system
            doesn't fight you.
          </p>
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
    <div className="flex items-center justify-between border-b border-border-subtle pb-5">
      <div>
        <p className="text-[15px] font-medium text-text-primary">{platform}</p>
        <p className="mt-0.5 text-sm text-text-muted">
          {on ? "Posts ship automatically" : "Posts wait for your approval"}
        </p>
      </div>
      <div
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          on ? "bg-accent" : "bg-border"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute h-5 w-5 rounded-full bg-bg-surface shadow-card transition-transform ${
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
      className="border-t border-border-subtle bg-bg-marketing-deep"
    >
      <div className="container-shell py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
              Currently building
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-text-primary">
              Letting in five a week
              <br />
              while we tune the voice.
            </h2>
            <p className="mt-6 max-w-lg text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
              Drop your email. We'll reach out when there's a slot. No drip
              campaign. No newsletter we forgot to set up. Just a real note
              when it's your turn.
            </p>
          </div>
          <div className="lg:col-span-5">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
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
