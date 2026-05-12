// Prompt construction for the IrieStack content run builder.
// One source idea in. A durable 30-day posting run out, in the user's voice.
// Per PSYCHOLOGY.md: never sound like AI, no em-dashes for fake authority,
// no "Here's the thing" / "Listen, the truth is" / SaaS speak, use specifics.

import type { Platform } from "./content-engine";

export const PLATFORM_BRIEFS: { name: Platform; label: string; brief: string; max: number }[] = [
  {
    name: "linkedin",
    label: "LinkedIn",
    brief:
      "Professional, line-broken for emphasis OK. Reflective, can be 2-3 short paragraphs. No buzzwords. No 'In today's fast-paced world.'",
    max: 3000,
  },
  {
    name: "x",
    label: "X",
    brief:
      "Terse, sharp, concrete. Single posts and thread items must each fit 280 characters. No hashtags unless user uses them.",
    max: 280,
  },
  {
    name: "threads",
    label: "Threads",
    brief:
      "Casual, conversational. May open with a setup like 'thing nobody tells you' / 'real talk' / 'here's what I've learned' if it fits the user's voice — never if it doesn't. Slightly longer than X.",
    max: 500,
  },
  {
    name: "substack",
    label: "Substack",
    brief:
      "Note-style. More reflective than X. Full sentences. May open with a small scene or specific detail. 2-3 short paragraphs OK.",
    max: 1000,
  },
  {
    name: "instagram",
    label: "Instagram",
    brief:
      "Caption-style for feed posts, or carousel storyboard when requested. Short paragraphs separated by line breaks.",
    max: 2200,
  },
  {
    name: "facebook",
    label: "Facebook",
    brief:
      "Personal/page post style. Slightly warmer and more complete than X. Can use short paragraphs. Avoid engagement-bait.",
    max: 63206,
  },
  {
    name: "tiktok",
    label: "TikTok",
    brief:
      "Caption or carousel/video storyboard style. Strong first line. Plain, direct, visually suggestive. Avoid fake viral language.",
    max: 2200,
  },
];

export function buildSystemPrompt(
  voiceNotes: string,
  profile?: Record<string, unknown> | null,
  links?: unknown[] | null
): string {
  const profileContext = buildProfileContext(profile, links);

  return `You are an editorial assistant rewriting a single source idea into platform-native social posts. Your only job is to make the output sound like the user wrote it themselves — never like an AI assistant, never like a generic content tool.

THE USER'S VOICE
${voiceNotes.trim() || "(The user has not provided voice notes yet. Default to plain, specific, conversational English. Short sentences. Real words. Avoid all of the bans below.)"}

ROOT CONTENT PROFILE
${profileContext || "(No onboarding profile has been saved yet. Ask less of the source and stay conservative.)"}

HARD BANS — never do these
- No em-dash filler ("It's not just X — it's Y" / "It's not about X — it's about Y")
- No SaaS-speak: "leverage", "synergy", "in today's fast-paced world", "the future of", "unlock", "revolutionize", "empower"
- No false-authority openers: "Here's the thing", "Listen", "Truth is", "Let me tell you", "The reality is"
- No emojis unless the user explicitly uses them in their voice notes
- No hashtags unless the user explicitly uses them
- No "in conclusion" / "ultimately" / "at the end of the day"
- No three-word punch sentences in a row ("Be bold. Be brave. Be you.") — this is the most-AI tell
- No closing with a generic question to drive engagement unless it's actually genuine for the platform (Instagram allows one)

QUALITY STANDARD — this matters more than volume
- Write like a strategic creative director, not a content farm
- Each post needs at least one of these: a belief shift, a real friction point, a specific proof point, a customer/user psychology insight, a sharp observation, or a concrete next action
- Make the audience feel seen: name what they are tired of, afraid of, trying to avoid, or hoping gets easier
- Do not summarize the source. Turn it into a point of view
- Avoid motivational wallpaper. No generic inspiration. No recycled creator advice
- Prefer one strong idea over three shallow ideas
- If a post could apply to any business, rewrite it until it clearly belongs to this profile

WRITING RULES
- Short sentences, but not all the same length — vary the rhythm
- Specific over general — replace abstract claims with concrete scenes, numbers, or observations from the source
- Front-load the most important idea
- Keep the user's actual phrasings if they appear in the voice notes or source
- If the source has a specific number, place name, time, or person, keep it
- Transform and synthesize the source into original social posts. Do not copy long passages from the source verbatim.
- If the source appears to quote another person or publication, preserve attribution in the post instead of making it sound like the user's original claim.

OUTPUT FORMAT
Return strictly valid JSON in this shape (no preamble, no markdown fences, no commentary):
{
  "run_name": "short useful name",
  "summary": "one paragraph explaining the angle of this 30-day run",
  "pieces": [
    {
      "platform": "x",
      "level": "level_1",
      "format": "single",
      "title": "short internal title",
      "hook": "optional hook",
      "body": "post body",
      "cta": "optional cta",
      "media_type": "image",
      "visual_prompt": "specific image direction for this post",
      "scheduled_day": 1
    },
    {
      "platform": "instagram",
      "level": "level_3",
      "format": "carousel_storyboard",
      "title": "short internal title",
      "hook": "optional hook",
      "body": "caption body",
      "media_type": "carousel",
      "visual_prompt": "overall carousel visual direction",
      "slides": [
        {"text": "slide text", "image_prompt": "visual direction"}
      ],
      "scheduled_day": 9
    }
  ]
}

Allowed platform values: x, linkedin, threads, instagram, facebook, tiktok, substack.
Allowed level values: level_1, level_2, level_3.
Allowed format values: single, long_post, thread, carousel_storyboard, note.
Body is plain text (line breaks OK as \\n).`;
}

function buildProfileContext(
  profile?: Record<string, unknown> | null,
  links?: unknown[] | null
) {
  if (!profile && !links?.length) return "";

  const lines = [
    field("Person / brand", profile?.personOrBrand),
    field("What they do", profile?.whatYouDo),
    field("Audience", profile?.audience),
    field("Offers", profile?.offers),
    field("Goals", profile?.goals),
    field("Platforms", profile?.platforms),
    field("Approval preference", profile?.approvalPreference),
    field("Posting rhythm", profile?.postingRhythm),
    field("Tone", profile?.tone),
    field("Phrases", profile?.phrases),
    field("Avoid", profile?.avoid),
    field("Stories", profile?.stories),
    linkField(links),
  ].filter(Boolean);

  return lines.join("\n");
}

function field(label: string, value: unknown) {
  if (Array.isArray(value)) {
    const items = value.filter((item) => typeof item === "string" && item.trim());
    return items.length ? `- ${label}: ${items.join(", ")}` : "";
  }
  return typeof value === "string" && value.trim() ? `- ${label}: ${value.trim()}` : "";
}

function linkField(links?: unknown[] | null) {
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
  return urls.length ? `- Important links: ${urls.join(", ")}` : "";
}

export function buildUserPrompt(source: string): string {
  return `Here is the source idea:

---
${source.trim()}
---

Build the first autonomous 30-day content run from this source.

Minimum output:
- 6 Level 1 pieces: same core idea reformatted for x, linkedin, threads, facebook, tiktok, substack
- 10 Level 2 pieces: individual insights from the source, including at least 3 x singles, 3 linkedin long_posts, 2 threads singles, 1 facebook long_post, and 1 tiktok caption/storyboard seed
- 3 Level 3 pieces: carousel_storyboard pieces for instagram, linkedin, and tiktok, 5-8 slides each

Visuals:
- Every piece must include media_type: image, carousel, video, or none
- Default to image for single posts and long posts unless the platform is text-first and the visual would add nothing
- Instagram and TikTok must never be media_type none
- Every piece with media_type image/carousel/video must include a visual_prompt
- visual_prompt must be specific enough for a designer, Canva agent, or image model to make the asset
- Avoid stock-photo direction. Prefer original, brand-relevant scenes, objects, layouts, product/context cues, or editorial treatments
- Carousel slides need image_prompt per slide, not just text

Scheduling:
- Spread pieces across scheduled_day 1 through 30
- Do not put more than 2 pieces on the same scheduled_day

Character limits:
${PLATFORM_BRIEFS.map((p) => `- ${p.label}: ${p.max} characters max`).join("\n")}
- Every X piece must be 280 characters or fewer. This is hard.
- If format is thread, body should be a numbered list of tweet-sized lines, and every line must fit 280 characters.

Each piece must stand alone. No "as I said above", no references to the source document, no copy/paste smell.`;
}
