export type FacebookPostResult = {
  id: string;
  url: string | null;
  raw: unknown;
};

export type FacebookPostOptions = {
  pageId?: string | null;
  pageAccessToken?: string | null;
  pageAccessTokenEnvKey?: string | null;
  imageUrl?: string | null;
};

export function facebookPostingIsConfigured() {
  return Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN);
}

export function facebookPostingIsConfiguredFor(options?: FacebookPostOptions | null) {
  const pageId = resolveEnvReference(options?.pageId);
  if (!pageId) return facebookPostingIsConfigured();
  return Boolean(resolvePageAccessToken(options));
}

export async function postToFacebook(
  message: string,
  options?: FacebookPostOptions | null
): Promise<FacebookPostResult> {
  const pageId = resolveEnvReference(options?.pageId) ?? process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = resolvePageAccessToken(options);

  if (!pageId || !pageAccessToken) {
    throw new Error(
      "Facebook posting is not configured. Set a page destination plus FACEBOOK_PAGE_ACCESS_TOKEN or its destination token env var."
    );
  }

  const endpoint = options?.imageUrl ? "photos" : "feed";
  const url = new URL(`https://graph.facebook.com/v23.0/${pageId}/${endpoint}`);
  const payload = new URLSearchParams();
  payload.set("access_token", pageAccessToken);
  if (options?.imageUrl) {
    payload.set("url", options.imageUrl);
    payload.set("caption", message);
  } else {
    payload.set("message", message);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readableFacebookError(raw, response.status));
  }

  const id =
    raw && typeof raw === "object" && "id" in raw && typeof raw.id === "string"
      ? raw.id
      : null;

  if (!id) throw new Error("Facebook API returned no post id.");

  return {
    id,
    url: `https://www.facebook.com/${id}`,
    raw,
  };
}

function resolvePageAccessToken(options?: FacebookPostOptions | null) {
  if (options?.pageAccessToken) return options.pageAccessToken;
  if (options?.pageAccessTokenEnvKey) return process.env[options.pageAccessTokenEnvKey];
  return process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
}

function resolveEnvReference(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("env:")) return process.env[value.slice("env:".length)] ?? null;
  return value;
}

function readableFacebookError(raw: unknown, status: number) {
  const error =
    raw && typeof raw === "object" && "error" in raw
      ? (raw as { error?: { message?: string; code?: number; type?: string } }).error
      : null;
  const message = error?.message ?? `Facebook returned ${status}.`;

  if (/access token could not be decrypted/i.test(message)) {
    return "Facebook rejected this token. Paste a fresh Page access token for this Facebook page in Vercel, then redeploy.";
  }

  if (/session has expired|invalid oauth access token|malformed access token/i.test(message)) {
    return "Facebook says this token is expired or invalid. Generate a fresh Page access token for this page and update Vercel.";
  }

  if (/permission/i.test(message)) {
    return `Facebook needs a token with the right Page posting permissions. ${message}`;
  }

  return message;
}
