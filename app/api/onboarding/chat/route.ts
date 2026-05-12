import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { getAnthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { extractJsonObject } from "@/lib/json-extract";

type OnboardingDraft = {
  profileName?: string;
  personOrBrand?: string;
  whatYouDo?: string;
  audience?: string;
  offers?: string;
  goals?: string;
  platforms?: string[];
  approvalPreference?: string;
  postingRhythm?: string;
  tone?: string;
  phrases?: string;
  avoid?: string;
  stories?: string;
  links?: string[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const { user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { messages?: ChatMessage[]; draft?: OnboardingDraft };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const draft = body.draft ?? {};

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 1800,
      system:
        "You are IrieStack's onboarding strategist. Your job is to help a non-technical business owner build a useful content profile through conversation. Do not make them fill forms. Infer what you can. Ask one simple follow-up when needed. Return valid JSON only.",
      messages: [
        {
          role: "user",
          content: `Return JSON only:
{
  "reply": "short helpful conversational response",
  "draft": {
    "profileName": "short profile name",
    "personOrBrand": "person, brand, or business",
    "whatYouDo": "plain description",
    "audience": "who they talk to",
    "offers": "services/products/topics",
    "goals": "what social should do for them",
    "platforms": ["X", "LinkedIn", "Facebook", "Instagram", "Threads", "TikTok", "Substack"],
    "approvalPreference": "monthly | weekly | daily | individual | autopilot",
    "postingRhythm": "plain posting rhythm",
    "tone": "voice/tone",
    "phrases": "words or phrases they actually use",
    "avoid": "what it should never sound like",
    "stories": "stories/examples they use",
    "links": ["https://..."]
  },
  "readyScore": 0,
  "nextQuestion": "one plain follow-up question, or empty string if enough for now"
}

Rules:
- Rough answers are enough. Never ask for perfection.
- Fill as much as you can from the conversation.
- Do not overwrite good existing draft fields unless the user clearly corrected them.
- Do not invent links.
- Choose platforms only from the allowed list.
- approvalPreference must be one of: monthly, weekly, daily, individual, autopilot.
- readyScore is 0-100 based on whether IrieStack can generate useful content from the profile.
- Ask the highest-leverage next question. Usually ask about audience, offers, goals, proof/stories, or voice.

Current draft:
${JSON.stringify(draft, null, 2)}

Conversation:
${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = JSON.parse(extractJsonObject(text)) as {
      reply?: unknown;
      draft?: OnboardingDraft;
      readyScore?: unknown;
      nextQuestion?: unknown;
    };

    return NextResponse.json({
      reply: cleanString(parsed.reply, "Good. I added that to the profile."),
      draft: parsed.draft ?? {},
      readyScore: typeof parsed.readyScore === "number" ? parsed.readyScore : 50,
      nextQuestion: cleanString(parsed.nextQuestion, ""),
    });
  } catch (error) {
    console.error("onboarding chat failed:", error);
    return NextResponse.json(fallbackOnboardingReply(messages, draft));
  }
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function fallbackOnboardingReply(messages: ChatMessage[], draft: OnboardingDraft) {
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  return {
    reply:
      "I can work with that. I captured the rough shape. Give me one sentence on who you want this content to reach, and I can tighten the profile.",
    draft: {
      ...draft,
      profileName: draft.profileName || draft.personOrBrand || "My Content Profile",
      whatYouDo: draft.whatYouDo || latest,
      platforms: draft.platforms?.length ? draft.platforms : ["Facebook", "Instagram", "X", "LinkedIn"],
      approvalPreference: draft.approvalPreference || "monthly",
    },
    readyScore: latest.trim().length > 20 ? 45 : 20,
    nextQuestion: "Who is the main person this content needs to reach?",
  };
}
