import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { SamplePosts } from "@/components/sample-posts";

export default function Home() {
  return (
    <main className="bg-bg-marketing min-h-screen">
      <Header />
      <Hero />
      <SamplePosts />
      <Explainer />
      <Waitlist />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="container-shell flex items-center justify-between pt-6 pb-4 sm:pt-8">
      <Link
        href="/"
        className="font-display text-[clamp(1.25rem,2vw,1.5rem)] tracking-tight text-text-primary"
      >
        IrieStack
      </Link>
      <Link
        href="/login"
        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
      >
        Sign in
      </Link>
    </header>
  );
}

function Hero() {
  return (
    <section className="container-shell pt-12 pb-20 sm:pt-20 sm:pb-32">
      <div className="max-w-3xl">
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
          Content automation
        </p>
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] tracking-tight text-text-primary">
          Your voice,
          <br />
          on autopilot.
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-relaxed text-text-secondary">
          One idea in. A week of platform-native content out. Trained on how
          <em className="not-italic font-medium text-text-primary"> you </em>
          actually talk — never sounds like an AI wrote it.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
          <a
            href="#waitlist"
            className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-medium text-text-primary shadow-card transition-all duration-150 hover:bg-accent-light hover:shadow-card-hover animate-cta-pulse"
          >
            Get on the waitlist
          </a>
          <a
            href="#how"
            className="inline-flex h-12 items-center justify-center rounded-md border border-border px-6 text-[15px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-hover hover:border-border-hover"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

function Explainer() {
  const steps = [
    {
      n: "01",
      title: "Train it once.",
      body:
        "A 10-minute chat — not a form, not a survey. We ask how you actually talk, what you sound like at your best, what you'd never say. The result is your Context Stack: a living asset you own.",
    },
    {
      n: "02",
      title: "Generate the week.",
      body:
        "Drop a long-form piece, a podcast clip, a half-formed thought. The system shapes it into 20+ posts — each one platform-native for LinkedIn, X, Threads, Instagram, your newsletter.",
    },
    {
      n: "03",
      title: "Approve, or autopilot.",
      body:
        "Per channel: review every post before it ships, or flip a switch and let it run. Telegram bot included so you can approve from anywhere. The system gets sharper every week.",
    },
  ];

  return (
    <section
      id="how"
      className="bg-bg-marketing-deep border-y border-border-subtle"
    >
      <div className="container-shell py-20 sm:py-28">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
            How it works
          </p>
          <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] leading-tight text-text-primary">
            Trained once. Yours forever.
          </h2>
          <p className="mt-4 text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
            Not a content calendar tool. Not a generic AI writer. An asset
            that compounds — your voice captured, scaled, and on schedule.
          </p>
        </div>
        <div className="grid gap-8 sm:gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.n}
              className="rounded-lg bg-bg-surface p-6 shadow-card transition-shadow duration-150 hover:shadow-card-hover"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-display text-base text-accent-deep">
                {step.n}
              </div>
              <h3 className="mb-3 text-lg font-semibold leading-snug text-text-primary">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-text-secondary">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  return (
    <section id="waitlist" className="container-shell py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
          Join the waitlist
        </p>
        <h2 className="font-display text-[clamp(1.875rem,4vw,3rem)] leading-tight text-text-primary">
          A short list. The first builds.
        </h2>
        <p className="mt-4 text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
          We're letting people in slowly while we tune the voice training.
          Drop your email — we'll reach out when there's a slot for you.
        </p>
        <div className="mt-10">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-marketing">
      <div className="container-shell py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} IrieStack. Built quietly.
        </p>
        <p className="text-sm text-text-muted">
          Part of the Irie ecosystem.
        </p>
      </div>
    </footer>
  );
}
