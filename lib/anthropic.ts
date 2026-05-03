import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local locally and to Vercel env vars for production."
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

// Default generation model — Sonnet for the main pipeline
export const GENERATION_MODEL = "claude-sonnet-4-6";
