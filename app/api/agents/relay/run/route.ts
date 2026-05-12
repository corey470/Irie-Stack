import { runSocialRelayAgent } from "@/lib/social-relay-agent";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return runSocialRelayAgent(req);
}

export async function POST(req: Request) {
  return runSocialRelayAgent(req);
}
