import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Generator } from "./generator";

export default async function GeneratePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stack } = await supabase
    .from("context_stacks")
    .select("id, voice_notes")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const stackHasVoice = (stack?.voice_notes ?? "").trim().length >= 40;

  return (
    <div className="max-w-4xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
        Generate
      </p>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
        One in. Many out.
      </h1>
      <p className="mt-3 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
        Paste a podcast clip transcript, a blog draft, a half-formed thought.
        The system rewrites it for five platforms — in your voice from the
        Stack.
      </p>

      {!stackHasVoice && (
        <div className="mt-6 rounded-md border border-border bg-bg-elevated p-4 text-sm text-text-secondary">
          <p>
            Heads up: your Stack is empty (or very short). Output will sound
            generic. Drop a few sentences about how you talk first —{" "}
            <Link
              href="/app/stack"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              edit your Stack
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-10">
        <Generator />
      </div>
    </div>
  );
}
