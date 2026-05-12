import { extractJsonObject } from "@/lib/json-extract";

export const PLATFORMS = [
  "x",
  "linkedin",
  "threads",
  "instagram",
  "facebook",
  "tiktok",
  "substack",
] as const;
export const LEVELS = ["level_1", "level_2", "level_3"] as const;
export const FORMATS = [
  "single",
  "long_post",
  "thread",
  "carousel_storyboard",
  "note",
] as const;

export type Platform = (typeof PLATFORMS)[number];
export type ContentLevel = (typeof LEVELS)[number];
export type ContentFormat = (typeof FORMATS)[number];

export type GeneratedSlide = {
  text: string;
  image_prompt: string;
};

export type GeneratedPiece = {
  platform: Platform;
  level: ContentLevel;
  format: ContentFormat;
  title: string;
  hook?: string;
  body: string;
  cta?: string;
  visual_prompt?: string;
  media_type?: "none" | "image" | "carousel" | "video";
  slides?: GeneratedSlide[];
  scheduled_day?: number;
};

export type GeneratedRun = {
  run_name: string;
  summary: string;
  pieces: GeneratedPiece[];
};

export type PieceValidation = {
  ok: boolean;
  maxChars: number | null;
  actualChars: number;
  qualityScore: number;
  errors: string[];
  warnings: string[];
};

export type ScheduleOptions = {
  postingTimes?: string[];
  timezoneOffsetMinutes?: number;
};

export const PLATFORM_LIMITS: Record<Platform, number | null> = {
  x: 280,
  linkedin: 3000,
  threads: 500,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  substack: 1000,
};

export function stripCodeFence(raw: string): string {
  return extractJsonObject(raw);
}

export function parseGeneratedRun(raw: string): GeneratedRun {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch {
    throw new Error("Couldn't parse the model response as JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model returned an empty response.");
  }

  const candidate = parsed as Partial<GeneratedRun>;
  if (
    typeof candidate.run_name !== "string" ||
    typeof candidate.summary !== "string" ||
    !Array.isArray(candidate.pieces)
  ) {
    throw new Error("Model returned the wrong run shape.");
  }

  const pieces = candidate.pieces
    .map(normalizePiece)
    .filter((piece): piece is GeneratedPiece => Boolean(piece));
  if (pieces.length < 8) {
    throw new Error("Model returned too few usable content pieces.");
  }

  return {
    run_name: candidate.run_name.trim().slice(0, 120) || "30-day content run",
    summary: candidate.summary.trim().slice(0, 800),
    pieces,
  };
}

function normalizePiece(piece: unknown): GeneratedPiece | null {
  if (!piece || typeof piece !== "object") return null;
  const p = piece as Record<string, unknown>;

  if (
    typeof p.platform !== "string" ||
    typeof p.level !== "string" ||
    typeof p.format !== "string" ||
    typeof p.title !== "string" ||
    typeof p.body !== "string"
  ) {
    return null;
  }

  if (!isPlatform(p.platform) || !isLevel(p.level) || !isFormat(p.format)) {
    return null;
  }

  const slides = Array.isArray(p.slides)
    ? p.slides
        .map((slide) => {
          if (!slide || typeof slide !== "object") return null;
          const s = slide as Record<string, unknown>;
          if (typeof s.text !== "string" || typeof s.image_prompt !== "string") {
            return null;
          }
          return {
            text: s.text.trim().slice(0, 240),
            image_prompt: s.image_prompt.trim().slice(0, 500),
          };
        })
        .filter((slide): slide is GeneratedSlide => Boolean(slide))
    : [];

  return {
    platform: p.platform,
    level: p.level,
    format: p.format,
    title: p.title.trim().slice(0, 120) || "Untitled piece",
    hook: typeof p.hook === "string" ? p.hook.trim().slice(0, 500) : undefined,
    body: p.body.trim(),
    cta: typeof p.cta === "string" ? p.cta.trim().slice(0, 500) : undefined,
    visual_prompt:
      typeof p.visual_prompt === "string"
        ? p.visual_prompt.trim().slice(0, 800)
        : defaultVisualPrompt({
            platform: p.platform,
            format: p.format,
            title: p.title,
            body: p.body,
            slides,
          }),
    media_type: normalizeMediaType(p.media_type, p.format),
    slides,
    scheduled_day:
      typeof p.scheduled_day === "number" && Number.isFinite(p.scheduled_day)
        ? Math.max(1, Math.min(30, Math.round(p.scheduled_day)))
        : undefined,
  };
}

export function validatePiece(piece: GeneratedPiece): PieceValidation {
  const maxChars = piece.format === "thread" ? 280 : PLATFORM_LIMITS[piece.platform];
  const errors: string[] = [];
  const warnings: string[] = [];
  const actualChars = piece.body.length;
  const quality = assessContentQuality(piece);

  if (maxChars && actualChars > maxChars) {
    errors.push(`${piece.platform} ${piece.format} is ${actualChars}/${maxChars} chars.`);
  }

  if (piece.platform === "tiktok" && piece.format !== "carousel_storyboard") {
    warnings.push("TikTok publishing is staged through a scheduler fallback unless media is attached.");
  }

  if (
    (piece.platform === "instagram" || piece.platform === "tiktok") &&
    piece.media_type === "none"
  ) {
    errors.push(`${piece.platform} needs a visual asset plan.`);
  }

  if (
    piece.media_type !== "none" &&
    (!piece.visual_prompt || piece.visual_prompt.trim().length < 40)
  ) {
    warnings.push("Visual prompt is too thin for a useful image.");
  }

  if (piece.format === "carousel_storyboard") {
    const slideCount = piece.slides?.length ?? 0;
    if (slideCount < 5) errors.push("Carousel storyboards need at least 5 slides.");
    if (slideCount > 10) warnings.push("Carousel storyboard is longer than 10 slides.");
  }

  if (piece.body.includes("—")) {
    warnings.push("Contains an em dash.");
  }

  if (quality.errors.length > 0) errors.push(...quality.errors);
  if (quality.warnings.length > 0) warnings.push(...quality.warnings);

  return {
    ok: errors.length === 0,
    maxChars,
    actualChars,
    qualityScore: quality.score,
    errors,
    warnings,
  };
}

function assessContentQuality(piece: GeneratedPiece) {
  const text = normalizeForQuality(piece.body);
  const lowered = text.toLowerCase();
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const banned = [
    "in today's fast-paced world",
    "unlock your potential",
    "game-changer",
    "revolutionize",
    "leverage",
    "synergy",
    "empower",
    "at the end of the day",
    "in conclusion",
    "here's the thing",
    "the reality is",
    "truth is",
    "let me tell you",
  ];

  for (const phrase of banned) {
    if (lowered.includes(phrase)) {
      errors.push(`Sounds generic: remove "${phrase}".`);
      score -= 18;
    }
  }

  const vagueClaims = [
    "build your brand",
    "take it to the next level",
    "stand out from the crowd",
    "valuable insights",
    "meaningful impact",
    "transform your business",
    "connect with your audience",
  ];

  for (const phrase of vagueClaims) {
    if (lowered.includes(phrase)) {
      warnings.push(`Vague phrase: replace "${phrase}" with something specific.`);
      score -= 8;
    }
  }

  if (/(be [a-z]+\. ){2,}be [a-z]+\./i.test(text)) {
    errors.push("AI-sounding cadence: avoid stacked motivational fragments.");
    score -= 20;
  }

  if (piece.format !== "carousel_storyboard" && text.length > 80 && !hasConcreteDetail(text)) {
    warnings.push("Needs a concrete detail, example, number, place, customer moment, or sharper observation.");
    score -= 12;
  }

  if (text.length > 140 && !hasPsychologyMove(lowered)) {
    warnings.push("Needs a clearer psychology move: belief shift, friction, desire, fear, proof, or next action.");
    score -= 10;
  }

  if (text.length > 180 && sentenceStartsRepeat(text)) {
    warnings.push("Sentence rhythm is repetitive.");
    score -= 8;
  }

  if (piece.format === "carousel_storyboard") {
    const weakSlides = (piece.slides ?? []).filter((slide) => {
      const slideText = normalizeForQuality(slide.text);
      return slideText.length < 18 || !hasPsychologyMove(slideText.toLowerCase());
    }).length;
    if (weakSlides >= 3) {
      warnings.push("Carousel slides need stronger story beats, not just labels.");
      score -= 10;
    }
  }

  if (score < 68) {
    errors.push("Quality check failed: this reads too generic or too thin.");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    errors,
    warnings,
  };
}

function normalizeForQuality(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasConcreteDetail(text: string) {
  return (
    /\d/.test(text) ||
    /\b(customer|client|founder|owner|driver|ride|store|page|post|week|month|morning|today|yesterday|calendar|queue|approval|link|transcript|voice memo)\b/i.test(text) ||
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/.test(text)
  );
}

function hasPsychologyMove(lowered: string) {
  return /\b(believe|trust|fear|friction|relief|desire|proof|attention|decision|habit|consistent|overwhelm|confident|remember|feel|why|because|instead|before|after|simple|specific|clear|pressure|off my plate|show up)\b/.test(lowered);
}

function sentenceStartsRepeat(text: string) {
  const starts = text
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim().split(/\s+/).slice(0, 2).join(" ").toLowerCase())
    .filter((start) => start.length > 3);
  if (starts.length < 4) return false;
  const counts = new Map<string, number>();
  for (const start of starts) {
    counts.set(start, (counts.get(start) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= 3);
}

export function scheduledDateForDay(
  startsOn: Date,
  day: number | undefined,
  index: number,
  options: ScheduleOptions = {}
): string {
  const safeDay = day ?? Math.min(30, 1 + index * 2);
  const date = new Date(startsOn);
  date.setDate(startsOn.getDate() + safeDay - 1);

  const [hour, minute] = scheduledTime(index, options.postingTimes);
  const timezoneOffsetMinutes = Number.isFinite(options.timezoneOffsetMinutes)
    ? options.timezoneOffsetMinutes ?? 0
    : 0;
  const localAsUtc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0
  );

  return new Date(localAsUtc + timezoneOffsetMinutes * 60_000).toISOString();
}

function scheduledTime(index: number, postingTimes: string[] | undefined): [number, number] {
  const times = postingTimes?.length ? postingTimes : ["09:00", "12:00", "15:00", "18:00"];
  const raw = times[index % times.length] ?? "09:00";
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw);
  if (!match) return [9, 0];
  return [Number(match[1]), Number(match[2])];
}

function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

function isLevel(value: string): value is ContentLevel {
  return (LEVELS as readonly string[]).includes(value);
}

function isFormat(value: string): value is ContentFormat {
  return (FORMATS as readonly string[]).includes(value);
}

function normalizeMediaType(value: unknown, format: string): GeneratedPiece["media_type"] {
  if (value === "none" || value === "image" || value === "carousel" || value === "video") {
    return value;
  }
  if (format === "carousel_storyboard") return "carousel";
  return "image";
}

function defaultVisualPrompt({
  platform,
  format,
  title,
  body,
  slides,
}: {
  platform: string;
  format: string;
  title: string;
  body: string;
  slides: GeneratedSlide[];
}) {
  if (format === "carousel_storyboard" && slides.length) {
    return `Create a platform-native carousel for ${platform}: clean editorial slides, strong contrast, human-readable text, grounded visual metaphors, and a consistent brand feel. Theme: ${title}.`;
  }

  return `Create a single social image for ${platform}: editorial, specific, not stock-like, with a clear visual idea that supports this post: ${title}. Use the post context: ${body.slice(0, 240)}.`;
}
