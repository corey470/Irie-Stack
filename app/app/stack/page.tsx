import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { StackEditor } from "./stack-editor";

export default async function StackPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stack } = await supabase
    .from("context_stacks")
    .select("id, name, voice_notes, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-accent-deep">
        Context Stack
      </p>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
        How you talk.
      </h1>
      <p className="mt-3 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
        The system reads this every time it writes for you. Be specific —
        phrasings you use, words you'd never use, the kind of stories you tell.
        The more you put here, the less the output sounds like AI.
      </p>

      <div className="mt-10">
        <StackEditor
          initialName={stack?.name ?? "My Stack"}
          initialVoiceNotes={stack?.voice_notes ?? ""}
          updatedAt={stack?.updated_at ?? null}
        />
      </div>
    </div>
  );
}
