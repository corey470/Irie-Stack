import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-auth";
import { ResearchClient } from "./research-client";

export default async function ResearchPage() {
  const { supabase, user } = await getAppContext();
  if (!user) redirect("/login");

  const { data: fuels } = await supabase
    .from("research_fuel")
    .select("id, source_type, source, title, summary, angles, talking_points, questions, cautions, source_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">Content Fuel</p>
          <h1 className="workspace-title">Build the source before the posts.</h1>
          <p className="workspace-copy">
            Start with a campaign conversation, URL, or topic. The result becomes
            the source draft that feeds the 30-day posting plan.
          </p>
        </div>
      </header>

      <ResearchClient initialFuels={(fuels ?? []) as InitialFuel[]} />
    </div>
  );
}

export type InitialFuel = {
  id: string;
  source_type: "url" | "topic";
  source: string;
  title: string;
  summary: string;
  angles: string[];
  talking_points: string[];
  questions: string[];
  cautions: string[];
  source_text?: string | null;
  created_at: string;
};
