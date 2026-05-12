import { runPostingAgent } from "@/lib/posting-agent";

export async function POST(req: Request) {
  return runPostingAgent(req);
}

export async function GET(req: Request) {
  return runPostingAgent(req);
}
