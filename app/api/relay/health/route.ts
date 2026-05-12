import { NextResponse } from "next/server";
import { PLATFORMS } from "@/lib/content-engine";
import { RELAY_STATUSES } from "@/lib/social-relay";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "irie-social-relay",
    version: "0.1",
    ingestPath: "/api/relay/posts",
    workerPath: "/api/agents/relay/run",
    dashboardPath: "/app/relay",
    platforms: PLATFORMS,
    statuses: RELAY_STATUSES,
  });
}
