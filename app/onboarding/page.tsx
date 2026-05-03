import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
          Onboarding
        </p>
        <h1 className="font-display text-[clamp(1.875rem,4vw,2.5rem)] leading-tight text-text-primary">
          Bootstrap chat — coming next slice.
        </h1>
        <p className="mt-4 text-text-secondary">
          The chat-driven Context Stack interview lands in the next build.
          The shell is already here so it has somewhere to plug in.
        </p>
        <Link
          href="/app"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-md border border-border bg-bg-surface px-6 text-[15px] font-medium text-text-primary shadow-card transition-all duration-150 hover:bg-bg-hover"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
