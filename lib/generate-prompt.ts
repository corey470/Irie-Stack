// Prompt construction for the IrieStack content rewriter.
// One source idea in. Multiple platform-native posts out — in the user's voice.
// Per PSYCHOLOGY.md: never sound like AI, no em-dashes for fake authority,
// no "Here's the thing" / "Listen, the truth is" / SaaS speak, use specifics.

export type Platform =
  | "LinkedIn"
  | "X"
  | "Threads"
  | "Newsletter"
  | "Instagram";

export const PLATFORMS: { name: Platform; brief: string; max: number }[] = [
  {
    name: "LinkedIn",
    brief:
      "Professional, line-broken for emphasis OK. Reflective, can be 2-3 short paragraphs. No buzzwords. No 'In today's fast-paced world.'",
    max: 3000,
  },
  {
    name: "X",
    brief:
      "Terse, lowercase OK if user's voice does that. No threading — single post. No hashtags unless user uses them.",
    max: 280,
  },
  {
    name: "Threads",
    brief:
      "Casual, conversational. May open with a setup like 'thing nobody tells you' / 'real talk' / 'here's what I've learned' if it fits the user's voice — never if it doesn't. Slightly longer than X.",
    max: 500,
  },
  {
    name: "Newsletter",
    brief:
      "More reflective. Full sentences. May open with a small scene or specific detail. 2-3 short paragraphs OK.",
    max: 1000,
  },
  {
    name: "Instagram",
    brief:
      "Caption-style. May end with a question or hook for engagement. Short paragraphs separated by line breaks.",
    max: 2200,
  },
];

export function buildSystemPrompt(voiceNotes: string): string {
  return `You are an editorial assistant rewriting a single source idea into platform-native social posts. Your only job is to make the output sound like the user wrote it themselves — never like an AI assistant, never like a generic content tool.

THE USER'S VOICE
${voiceNotes.trim() || "(The user has not provided voice notes yet. Default to plain, specific, conversational English. Short sentences. Real words. Avoid all of the bans below.)"}

HARD BANS — never do these
- No em-dash filler ("It's not just X — it's Y" / "It's not about X — it's about Y")
- No SaaS-speak: "leverage", "synergy", "in today's fast-paced world", "the future of", "unlock", "revolutionize", "empower"
- No false-authority openers: "Here's the thing", "Listen", "Truth is", "Let me tell you", "The reality is"
- No emojis unless the user explicitly uses them in their voice notes
- No hashtags unless the user explicitly uses them
- No "in conclusion" / "ultimately" / "at the end of the day"
- No three-word punch sentences in a row ("Be bold. Be brave. Be you.") — this is the most-AI tell
- No closing with a generic question to drive engagement unless it's actually genuine for the platform (Instagram allows one)

WRITING RULES
- Short sentences, but not all the same length — vary the rhythm
- Specific over general — replace abstract claims with concrete scenes, numbers, or observations from the source
- Front-load the most important idea
- Keep the user's actual phrasings if they appear in the voice notes or source
- If the source has a specific number, place name, time, or person, keep it

OUTPUT FORMAT
Return strictly valid JSON in this shape (no preamble, no markdown fences, no commentary):
{
  "posts": [
    {"platform": "LinkedIn", "body": "..."},
    {"platform": "X", "body": "..."},
    {"platform": "Threads", "body": "..."},
    {"platform": "Newsletter", "body": "..."},
    {"platform": "Instagram", "body": "..."}
  ]
}

Each platform appears exactly once, in this order. Body is plain text (line breaks OK as \\n).`;
}

export function buildUserPrompt(source: string): string {
  return `Here is the source idea:

---
${source.trim()}
---

Rewrite it into one post for each platform. Each post must stand alone — assume the reader sees only that platform.`;
}
