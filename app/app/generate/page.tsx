import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { Generator } from "./generator";

export default async function GeneratePage() {
  const { supabase, user } = await getAppContext();
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
    <div className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">Create Posts</p>
          <h1 className="workspace-title">
            Turn one source into a month of posts.
          </h1>
          <p className="workspace-copy">
            Add a campaign draft, transcript, article, or rough thought. IrieStack
            builds the 30-day plan, then you review, edit, add images, and approve.
          </p>
        </div>
      </header>

      {!stackHasVoice && (
        <div className="mb-4 rounded-md border border-border bg-bg-elevated p-4 text-sm text-text-secondary">
          <p>
            Your voice notes are empty or short, so the posts may sound generic.
            Add a few sentences about how you talk first —{" "}
            <Link
              href="/app/stack"
              className="font-medium text-accent-deep underline underline-offset-2"
            >
              edit your voice
            </Link>
            .
          </p>
        </div>
      )}

      <Generator />
    </div>
  );
}
