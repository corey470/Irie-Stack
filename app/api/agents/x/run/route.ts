import { runPostingAgent } from "@/lib/posting-agent";

export async function POST(req: Request) {
  return runPostingAgent(withXPlatform(req));
}

export async function GET(req: Request) {
  return runPostingAgent(withXPlatform(req));
}

function withXPlatform(req: Request) {
  const url = new URL(req.url);
  url.searchParams.set("platform", "x");
  return new Request(url, req);
}
