import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { getAnthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { extractJsonObject } from "@/lib/json-extract";

type CampaignDraft = {
  template?: string;
  subject?: string;
  audience?: string;
  offer?: string;
  proof?: string;
  pointOfView?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { messages?: ChatMessage[]; draft?: CampaignDraft };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const draft = body.draft ?? {};
  const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  const { data: stack } = await supabase
    .from("context_stacks")
    .select("voice_notes, profile, links")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 1400,
      system:
        "You are IrieStack's campaign strategist. Your job is to turn a rough spoken idea into a content campaign brief. Be calm, direct, and useful. Do not make the user fill out a form. Infer what you can. Ask one simple follow-up only if it would materially improve the campaign. Return JSON only.",
      messages: [
        {
          role: "user",
          content: `Return JSON only:
{
  "reply": "short conversational response to the user",
  "draft": {
    "template": "one of: Service explainer, Founder note, Customer problem, Myth vs reality, Local spotlight, Offer / promotion, FAQ article, Product story",
    "subject": "what the campaign is about",
    "audience": "who it is for",
    "offer": "what the reader should do next",
    "proof": "specific proof/details/stories to use",
    "pointOfView": "the campaign's opinion or belief shift"
  },
  "ready": true,
  "nextQuestion": "one plain follow-up question, or empty string if ready"
}

Rules:
- The user should not need perfect answers.
- If the user gives a rough campaign idea, infer a useful complete draft from it.
- Use the stored profile when helpful.
- Do not invent hard facts, testimonials, guarantees, prices, or stats.
- Do not write "no surge pricing" or "always cheaper" unless the user explicitly says that is true.
- When comparing against Uber/Lyft or another company, critique the platform model and customer experience, not individual drivers.
- No em dashes. Use commas, periods, colons, or parentheses.
- If details are missing, keep them broad and ask only one question.
- Set ready true if the campaign is usable enough to create a source draft.

Stored profile:
${JSON.stringify(stack?.profile ?? {}, null, 2)}

Voice notes:
${stack?.voice_notes ?? ""}

Current draft:
${JSON.stringify(draft, null, 2)}

Conversation:
${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

Latest user message:
${latestUser}`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = JSON.parse(extractJsonObject(text)) as {
      reply?: unknown;
      draft?: CampaignDraft;
      ready?: unknown;
      nextQuestion?: unknown;
    };

    return NextResponse.json({
      reply: cleanString(parsed.reply, "Good. I can build a campaign from that."),
      draft: {
        ...draft,
        ...(parsed.draft ?? {}),
      },
      ready: Boolean(parsed.ready),
      nextQuestion: cleanString(parsed.nextQuestion, ""),
    });
  } catch (error) {
    console.error("campaign chat failed:", error);
    return NextResponse.json(fallbackCampaignReply(latestUser, draft));
  }
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function fallbackCampaignReply(message: string, draft: CampaignDraft) {
  const subject = draft.subject || message;
  return {
    reply:
      "I can work with that. I sketched the campaign shape from your idea. Add one real proof point if you have it, then build the source draft.",
    draft: {
      template: draft.template || "Customer problem",
      subject,
      audience: draft.audience || "people comparing their options",
      offer: draft.offer || "choose the more reliable option",
      proof: draft.proof || "real service details, customer moments, and practical differences",
      pointOfView:
        draft.pointOfView ||
        "The cheapest or most familiar option is not always the best option when reliability matters.",
    },
    ready: subject.trim().length > 8,
    nextQuestion: "What is one real detail that proves this?",
  };
}
