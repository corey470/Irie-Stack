export type XPostResult = {
  id: string;
  text: string;
  url: string | null;
  raw: unknown;
};

export function xPostingIsConfigured() {
  return Boolean(process.env.X_ACCESS_TOKEN);
}

export async function postToX(text: string): Promise<XPostResult> {
  const accessToken = process.env.X_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("X posting is not configured. Set X_ACCESS_TOKEN.");
  }

  if (text.length > 280) {
    throw new Error(`X post is ${text.length}/280 characters.`);
  }

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      raw && typeof raw === "object" && "detail" in raw
        ? String(raw.detail)
        : `X API returned ${response.status}`;
    throw new Error(message);
  }

  const data =
    raw && typeof raw === "object" && "data" in raw
      ? (raw.data as Record<string, unknown>)
      : {};
  const id = typeof data.id === "string" ? data.id : null;
  const postedText = typeof data.text === "string" ? data.text : text;

  if (!id) throw new Error("X API returned no tweet id.");

  return {
    id,
    text: postedText,
    url: `https://x.com/i/web/status/${id}`,
    raw,
  };
}
