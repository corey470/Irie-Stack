import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 5;

export async function assertPublicHttpUrl(input: string) {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Add a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must start with http:// or https://.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isBlockedHost(hostname)) {
    throw new Error("Private URLs cannot be used here.");
  }

  if (!isIP(hostname)) {
    let records: LookupAddress[];
    try {
      records = (await lookup(hostname, { all: true })) as LookupAddress[];
    } catch {
      throw new Error("Could not verify that URL.");
    }

    if (records.some((record) => isBlockedIp(record.address))) {
      throw new Error("Private URLs cannot be used here.");
    }
  }

  return parsed.toString();
}

export async function fetchPublicUrl(
  input: string,
  init: Omit<RequestInit, "redirect"> = {},
  redirects = 0
): Promise<Response> {
  const safeUrl = await assertPublicHttpUrl(input);
  const response = await fetch(safeUrl, { ...init, redirect: "manual" });

  if (isRedirect(response.status)) {
    if (redirects >= MAX_REDIRECTS) throw new Error("That URL redirected too many times.");
    const location = response.headers.get("location");
    if (!location) throw new Error("That URL redirected without a location.");

    const nextUrl = new URL(location, safeUrl).toString();
    return fetchPublicUrl(nextUrl, init, redirects + 1);
  }

  return response;
}

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

function isBlockedHost(hostname: string) {
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  ) {
    return true;
  }

  return isBlockedIp(hostname);
}

function isBlockedIp(address: string) {
  if (isBlockedIpv4(address)) return true;

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("ff")
  );
}

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}
