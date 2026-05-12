import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import {
  buildCampaignFuel,
  buildResearchFuel,
  researchFuelToSource,
} from "@/lib/research-harvester";

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: {
    url?: string;
    topic?: string;
    campaign?: {
      template?: string;
      subject?: string;
      audience?: string;
      offer?: string;
      proof?: string;
      pointOfView?: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  try {
    const { data: stack } = await supabase
      .from("context_stacks")
      .select("id, voice_notes, profile, links")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const fuel = body.campaign
      ? await buildCampaignFuel({
          template: body.campaign.template ?? "",
          subject: body.campaign.subject ?? "",
          audience: body.campaign.audience,
          offer: body.campaign.offer,
          proof: body.campaign.proof,
          pointOfView: body.campaign.pointOfView,
          voiceNotes: stack?.voice_notes ?? "",
          profile: (stack?.profile ?? {}) as Record<string, unknown>,
          links: (stack?.links ?? []) as unknown[],
        })
      : await buildResearchFuel({
          url: body.url,
          topic: body.topic,
        });

    const { data: savedFuel, error: saveError } = await supabase
      .from("research_fuel")
      .insert({
        user_id: user.id,
        stack_id: stack?.id ?? null,
        source_type: fuel.sourceType,
        source: fuel.source,
        title: fuel.title,
        summary: fuel.summary,
        angles: fuel.angles,
        talking_points: fuel.talkingPoints,
        questions: fuel.questions,
        cautions: fuel.cautions,
        source_text: fuel.sourceText,
        metadata: {
          createdBy: "content-fuel",
          mode: body.campaign ? "campaign" : body.url ? "url" : "topic",
          campaign: body.campaign ?? null,
        },
      })
      .select("id")
      .single();

    if (saveError) {
      console.error("research fuel save failed:", saveError);
    }

    return NextResponse.json({
      fuel: { ...fuel, id: savedFuel?.id ?? null },
      sourceForPosts: researchFuelToSource(fuel),
      saved: !saveError,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build content fuel." },
      { status: 400 }
    );
  }
}
