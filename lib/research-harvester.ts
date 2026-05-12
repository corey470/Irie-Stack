import { getAnthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { extractJsonObject } from "@/lib/json-extract";
import { assertPublicHttpUrl, fetchPublicUrl } from "@/lib/url-safety";

export type ResearchFuel = {
  sourceType: "url" | "topic";
  source: string;
  title: string;
  summary: string;
  angles: string[];
  talkingPoints: string[];
  questions: string[];
  cautions: string[];
  sourceText: string;
};

export type CampaignFuelInput = {
  template: string;
  subject: string;
  audience?: string;
  offer?: string;
  proof?: string;
  pointOfView?: string;
  voiceNotes?: string;
  profile?: Record<string, unknown> | null;
  links?: unknown[] | null;
};

type RawHarvest = {
  title: string;
  description: string;
  text: string;
  metadata: Record<string, unknown>;
};

const MAX_SOURCE_CHARS = 12000;

export async function buildResearchFuel({
  url,
  topic,
}: {
  url?: string;
  topic?: string;
}): Promise<ResearchFuel> {
  const cleanUrl = (url ?? "").trim();
  const cleanTopic = (topic ?? "").trim();

  if (cleanUrl) {
    const raw = await harvestUrl(cleanUrl);
    return distillFuel({
      sourceType: "url",
      source: cleanUrl,
      title: raw.title,
      fallbackText: raw.text,
      description: raw.description,
    });
  }

  if (cleanTopic.length < 8) {
    throw new Error("Add a URL or a topic with a little more detail.");
  }

  return distillFuel({
    sourceType: "topic",
    source: cleanTopic,
    title: cleanTopic.slice(0, 120),
    fallbackText: cleanTopic,
    description: "",
  });
}

export async function buildCampaignFuel(input: CampaignFuelInput): Promise<ResearchFuel> {
  const template = input.template.trim();
  const subject = input.subject.trim();
  if (!template) throw new Error("Choose what kind of content you want to make.");
  if (subject.length < 8) throw new Error("Add a little more detail about the thing you want to promote or explain.");

  const fallback = heuristicCampaignFuel(input);

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 3600,
      system:
        "You are a senior content strategist. Turn a business/campaign brief into an original source article that the owner can repurpose into social posts. Make it specific, useful, psychologically aware, and grounded. Do not sound like generic AI marketing copy. Return valid JSON only.",
      messages: [
        {
          role: "user",
          content: `Return JSON only with this shape:
{
  "title": "source article title",
  "summary": "2 sentence plain-language summary",
  "sourceArticle": "450-750 word original source article in the owner's voice",
  "angles": ["6 original social angles"],
  "talkingPoints": ["10 specific talking points"],
  "questions": ["5 questions the audience is probably asking"],
  "cautions": ["3 factual, compliance, or positioning cautions"]
}

Template: ${template}
Subject: ${subject}
Audience: ${input.audience?.trim() || "not specified"}
Offer or next step: ${input.offer?.trim() || "not specified"}
Proof, story, or details: ${input.proof?.trim() || "not specified"}
Point of view: ${input.pointOfView?.trim() || "not specified"}

Known profile:
${profileLines(input.profile, input.links) || "No structured profile saved yet."}

Voice notes:
${input.voiceNotes?.trim() || "Plain, specific, conversational. Avoid corporate language."}

Writing rules:
- No em dashes. Use commas, periods, colons, or parentheses.
- Do not open with "Let me tell you", "Here's the thing", "The truth is", or "In today's world".
- Do not claim exact prices, no surge pricing, guaranteed availability, safety, or superiority unless the proof explicitly says it.
- If comparing against Uber/Lyft or another company, critique the model and customer experience, not individual drivers.
- Do not sound combative. The angle should feel useful, local, and grounded.
- Write with a clear point of view, but keep claims believable.
- Prefer "one reason this matters" over long sweeping arguments.

Write the source article as owned material for this business. It should feel like a useful blog/note the owner could publish, then IrieStack can break it into a 30-day plan.`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = JSON.parse(extractJsonObject(text)) as {
      title?: unknown;
      summary?: unknown;
      sourceArticle?: unknown;
      angles?: unknown;
      talkingPoints?: unknown;
      questions?: unknown;
      cautions?: unknown;
    };

    const sourceArticle = scrubGeneratedCopy(cleanString(parsed.sourceArticle, fallback.sourceText, 12000));
    return {
      sourceType: "topic",
      source: `Campaign: ${template} - ${subject}`,
      title: scrubGeneratedCopy(cleanString(parsed.title, fallback.title, 140)),
      summary: scrubGeneratedCopy(cleanString(parsed.summary, fallback.summary, 900)),
      angles: cleanList(parsed.angles, fallback.angles, 6).map(scrubGeneratedCopy),
      talkingPoints: cleanList(parsed.talkingPoints, fallback.talkingPoints, 10).map(scrubGeneratedCopy),
      questions: cleanList(parsed.questions, fallback.questions, 6).map(scrubGeneratedCopy),
      cautions: cleanList(parsed.cautions, fallback.cautions, 4).map(scrubGeneratedCopy),
      sourceText: sourceArticle,
    };
  } catch (error) {
    console.warn("[research] campaign fuel generation failed, using heuristic draft:", error);
    return fallback;
  }
}

async function harvestUrl(rawUrl: string): Promise<RawHarvest> {
  const safeUrl = await assertPublicHttpUrl(rawUrl);

  if (process.env.FIRECRAWL_API_KEY) {
    try {
      return await firecrawlScrape(safeUrl);
    } catch (error) {
      console.warn("[research] Firecrawl failed, falling back to direct fetch:", error);
    }
  }

  return directFetch(safeUrl);
}

async function firecrawlScrape(url: string): Promise<RawHarvest> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "summary", "links"],
      onlyMainContent: true,
      blockAds: true,
      timeout: 120000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firecrawl failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const data = payload.data ?? payload;
  const text = String(data.markdown ?? data.summary ?? "").slice(0, MAX_SOURCE_CHARS);

  return {
    title: data.metadata?.title ?? data.title ?? url,
    description: data.metadata?.description ?? "",
    text,
    metadata: data.metadata ?? {},
  };
}

async function directFetch(url: string): Promise<RawHarvest> {
  const response = await fetchPublicUrl(url, {
    headers: {
      "user-agent": "IrieStack/0.1 research-harvester",
      accept: "text/html,text/plain,application/json;q=0.8,*/*;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(blockedUrlMessage(response.status));
  }

  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  const text = contentType.includes("html") ? htmlToText(raw) : normalizeText(raw);

  return {
    title: contentType.includes("html") ? extractTitle(raw) ?? url : url,
    description: contentType.includes("html") ? extractMetaDescription(raw) ?? "" : "",
    text: text.slice(0, MAX_SOURCE_CHARS),
    metadata: { fetchedAt: new Date().toISOString(), contentType },
  };
}

async function distillFuel({
  sourceType,
  source,
  title,
  description,
  fallbackText,
}: {
  sourceType: "url" | "topic";
  source: string;
  title: string;
  description: string;
  fallbackText: string;
}): Promise<ResearchFuel> {
  const sourceText = normalizeText(fallbackText).slice(0, MAX_SOURCE_CHARS);
  const heuristic = heuristicFuel({ sourceType, source, title, description, sourceText });

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 1800,
      system:
        "You turn raw research into original content fuel. Extract ideas, angles, questions, and useful talking points. Do not copy long passages. Do not present outside material as the user's original work.",
      messages: [
        {
          role: "user",
          content: `Return JSON only with this shape:
{
  "title": "short research title",
  "summary": "plain-language summary in 2-3 sentences",
  "angles": ["5 original post angles"],
  "talkingPoints": ["8 concise talking points"],
  "questions": ["5 useful questions this source raises"],
  "cautions": ["3 copyright/fact-check cautions"]
}

Source type: ${sourceType}
Source: ${source}
Title: ${title}
Description: ${description}

Raw material:
${sourceText}`,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = JSON.parse(extractJsonObject(text)) as Partial<ResearchFuel>;

    return {
      sourceType,
      source,
      title: cleanString(parsed.title, heuristic.title, 140),
      summary: cleanString(parsed.summary, heuristic.summary, 900),
      angles: cleanList(parsed.angles, heuristic.angles, 6),
      talkingPoints: cleanList(parsed.talkingPoints, heuristic.talkingPoints, 10),
      questions: cleanList(parsed.questions, heuristic.questions, 6),
      cautions: cleanList(parsed.cautions, heuristic.cautions, 4),
      sourceText,
    };
  } catch (error) {
    console.warn("[research] AI distillation failed, using heuristic fuel:", error);
    return heuristic;
  }
}

function heuristicFuel({
  sourceType,
  source,
  title,
  description,
  sourceText,
}: {
  sourceType: "url" | "topic";
  source: string;
  title: string;
  description: string;
  sourceText: string;
}): ResearchFuel {
  const lines = sourceText
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 40 && line.length < 240);
  const headings = sourceText
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s+/, "").trim())
    .map(cleanLine)
    .filter((line) => line.length > 8 && line.length < 120)
    .slice(0, 6);

  return {
    sourceType,
    source,
    title: title || source,
    summary:
      description ||
      lines.slice(0, 2).join(" ") ||
      "Research captured. Review the talking points before turning this into posts.",
    angles: dedupe([...headings, ...lines]).slice(0, 5),
    talkingPoints: dedupe(lines).slice(0, 8),
    questions: [
      "What does this make your audience think about differently?",
      "What part of this do you agree with?",
      "What part needs a stronger point of view?",
      "What story from your own work connects to this?",
      "What should someone do next after reading this?",
    ],
    cautions: [
      "Use this as research fuel, not copy-paste content.",
      "Fact-check claims before publishing.",
      "Give credit or link back when directly referencing someone else's work.",
    ],
    sourceText,
  };
}

export function researchFuelToSource(fuel: ResearchFuel) {
  const ownedDraft =
    fuel.source.startsWith("Campaign:") && fuel.sourceText.trim()
      ? `\nOwned source draft:\n${fuel.sourceText.trim()}\n`
      : "";

  return `Research fuel: ${fuel.title}

Source: ${fuel.source}

Summary:
${fuel.summary}
${ownedDraft}

Original post angles to explore:
${fuel.angles.map((item) => `- ${item}`).join("\n")}

Talking points:
${fuel.talkingPoints.map((item) => `- ${item}`).join("\n")}

Useful questions:
${fuel.questions.map((item) => `- ${item}`).join("\n")}

Important guardrails:
${fuel.cautions.map((item) => `- ${item}`).join("\n")}

Create original posts in my voice from these ideas. Do not copy the source wording.`;
}

function heuristicCampaignFuel(input: CampaignFuelInput): ResearchFuel {
  const subject = input.subject.trim();
  const template = input.template.trim() || "Campaign";
  const audience = input.audience?.trim() || "the people this business serves";
  const offer = input.offer?.trim() || "the next clear step";
  const proof = input.proof?.trim() || "real customer moments, practical details, and lived experience";
  const pointOfView = input.pointOfView?.trim() || "make the useful choice easier and less stressful";
  const brand = profileString(input.profile, "personOrBrand") || profileString(input.profile, "whatYouDo") || "this business";

  const sourceText = normalizeText(`${subject}

${brand} is creating this content for ${audience}. The point is not to fill a calendar with random posts. The point is to explain why this matters, what people usually misunderstand, and what should feel easier after they read it.

The main angle: ${pointOfView}. That gives the content a job. It should help someone recognize a problem, name the friction, and see why ${offer} is a practical next move.

The proof to build around is simple: ${proof}. Specifics matter here. The strongest content should use real moments, concrete scenes, common objections, small frustrations, and clear next steps instead of polished claims.

This campaign should become a source article first, then social posts after. The article can carry the fuller argument. The posts can each carry one useful piece: one belief shift, one story, one comparison, one question, one reason to act, or one customer-facing reminder.`);

  return {
    sourceType: "topic",
    source: `Campaign: ${template} - ${subject}`,
    title: `${template}: ${subject}`.slice(0, 140),
    summary: `A source draft for ${subject}, built around ${audience} and the next step: ${offer}.`,
    angles: [
      `Why ${subject} matters to ${audience}`,
      `The common friction people feel before they choose ${offer}`,
      `A practical story or example that proves the point`,
      `What people misunderstand about this decision`,
      `A simple before-and-after comparison`,
      `The next action someone should take`,
    ],
    talkingPoints: [
      subject,
      `Audience: ${audience}`,
      `Offer or next step: ${offer}`,
      `Point of view: ${pointOfView}`,
      `Proof: ${proof}`,
      "Use scenes and customer moments instead of vague claims.",
      "Make every post stand alone.",
      "Keep the content useful before it becomes promotional.",
    ],
    questions: [
      "What does the customer usually worry about before acting?",
      "What makes this offer easier than the usual way?",
      "What proof can the business show without overclaiming?",
      "What small moment would make the audience feel seen?",
      "What should the reader do next?",
    ],
    cautions: [
      "Do not invent proof, numbers, reviews, or guarantees.",
      "Keep claims specific and believable.",
      "Make the content useful first, promotional second.",
    ],
    sourceText,
  };
}

function profileLines(profile?: Record<string, unknown> | null, links?: unknown[] | null) {
  const lines = [
    profileField("Person / brand", profile?.personOrBrand),
    profileField("What they do", profile?.whatYouDo),
    profileField("Audience", profile?.audience),
    profileField("Offers", profile?.offers),
    profileField("Goals", profile?.goals),
    profileField("Tone", profile?.tone),
    profileField("Phrases", profile?.phrases),
    profileField("Avoid", profile?.avoid),
    profileField("Stories", profile?.stories),
    profileLinks(links),
  ].filter(Boolean);
  return lines.join("\n");
}

function profileField(label: string, value: unknown) {
  if (Array.isArray(value)) {
    const items = value.filter((item) => typeof item === "string" && item.trim());
    return items.length ? `- ${label}: ${items.join(", ")}` : "";
  }
  return typeof value === "string" && value.trim() ? `- ${label}: ${value.trim()}` : "";
}

function profileLinks(links?: unknown[] | null) {
  if (!Array.isArray(links)) return "";
  const urls = links
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "url" in item) {
        return String((item as { url?: unknown }).url ?? "");
      }
      return "";
    })
    .map((item) => item.trim())
    .filter(Boolean);
  return urls.length ? `- Links: ${urls.join(", ")}` : "";
}

function profileString(profile: Record<string, unknown> | null | undefined, key: string) {
  const value = profile?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function cleanString(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : fallback.slice(0, max);
}

function scrubGeneratedCopy(value: string) {
  return value
    .replace(/[—–]/g, "-")
    .replace(/\bLet me tell you[:,]?\s*/gi, "")
    .replace(/\bHere'?s the thing[:,]?\s*/gi, "")
    .replace(/\bThe truth is[:,]?\s*/gi, "")
    .replace(/\bIn today'?s world[:,]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanList(value: unknown, fallback: string[], max: number) {
  if (!Array.isArray(value)) return fallback.slice(0, max);
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return (items.length ? dedupe(items) : fallback).slice(0, max);
}

function dedupe(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function htmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  return normalizeText(
    withoutNoise
      .replace(/<\/(p|div|li|h[1-6]|blockquote|section|article)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
  );
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLine(input: string) {
  return normalizeText(
    input
      .replace(/`{1,3}[^`]*`{1,3}/g, " ")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/[>#*_~]/g, " ")
  );
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeText(stripTags(match[1])).slice(0, 160) : undefined;
}

function extractMetaDescription(html: string): string | undefined {
  const match = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  return match ? normalizeText(match[1]).slice(0, 300) : undefined;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function blockedUrlMessage(status: number) {
  if (status === 401 || status === 403) {
    return "That site blocked automated reading. Paste the article text into the Topic tab instead, or use a public source URL.";
  }
  return `Could not read that URL (${status}).`;
}
