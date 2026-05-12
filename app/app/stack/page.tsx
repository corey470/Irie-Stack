import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { StackEditor } from "./stack-editor";

export default async function StackPage() {
  const { supabase, user } = await getAppContext();
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
        Your Voice
      </p>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-text-primary">
        Make the posts sound like you.
      </h1>
      <p className="mt-3 max-w-2xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-text-secondary">
        Answer a few plain questions. The app turns those answers into the
        voice profile it uses whenever it writes for you.
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
