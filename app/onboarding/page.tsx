import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { OnboardingClient, type InitialOnboarding } from "./onboarding-client";

export default async function OnboardingPage() {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const { data: stack } = await supabase
    .from("context_stacks")
    .select("id, name, voice_notes, profile, links, onboarding_completed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-bg-primary p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-accent-deep">
          Onboarding
        </p>
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
          Build the root profile first.
        </h1>
        <p className="mt-4 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
          This is the funnel. Your audience, links, voice, offers, and posting
          preferences become the context every research pull and post run uses.
        </p>

        <div className="mt-10">
          <OnboardingClient
            initial={{
              name: stack?.name ?? "My Content Profile",
              voiceNotes: stack?.voice_notes ?? "",
              profile: (stack?.profile ?? {}) as Record<string, unknown>,
              links: Array.isArray(stack?.links) ? stack.links : [],
              completedAt: stack?.onboarding_completed_at ?? null,
            }}
          />
        </div>
      </div>
    </main>
  );
}

export type { InitialOnboarding };
