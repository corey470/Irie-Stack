import { fetchPublicUrl } from "@/lib/url-safety";

export type SourceInput =
  | {
      type: "paste";
      text: string;
      metadata: { length: number };
    }
  | {
      type: "url";
      text: string;
      metadata: {
        url: string;
        title?: string;
        description?: string;
        fetchedAt: string;
        length: number;
      };
    };

const MAX_SOURCE_CHARS = 12000;

export async function resolveSourceInput({
  source,
  sourceUrl,
}: {
  source?: string;
  sourceUrl?: string;
}): Promise<SourceInput> {
  const pasted = (source ?? "").trim();
  const url = (sourceUrl ?? "").trim();

  if (url) return fetchUrlSource(url);

  return {
    type: "paste",
    text: pasted,
    metadata: { length: pasted.length },
  };
}

async function fetchUrlSource(rawUrl: string): Promise<SourceInput> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("That source URL is not valid.");
  }

  const response = await fetchPublicUrl(url.toString(), {
    headers: {
      "user-agent": "IrieStack/0.1 source-fetcher",
      accept: "text/html,text/plain,application/json;q=0.8,*/*;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(blockedUrlMessage(response.status));
  }

  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  const title = contentType.includes("html") ? extractTitle(raw) : undefined;
  const description = contentType.includes("html")
    ? extractMetaDescription(raw)
    : undefined;
  const text = contentType.includes("html") ? htmlToText(raw) : normalizeText(raw);
  const clipped = text.slice(0, MAX_SOURCE_CHARS);

  return {
    type: "url",
    text: clipped,
    metadata: {
        url: url.toString(),
      title,
      description,
      fetchedAt: new Date().toISOString(),
      length: clipped.length,
    },
  };
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
    return "That page blocked automated reading. Paste the article text instead, or use Content Fuel's Topic tab with the parts you want to discuss.";
  }
  return `Could not fetch source URL (${status}).`;
}
