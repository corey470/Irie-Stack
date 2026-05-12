import { NextResponse } from "next/server";
import {
  missingPostingConfigMessage,
  postingIsConfiguredFor,
} from "@/lib/posting-config";
import { syncRelayPostForContentPiece } from "@/lib/relay-sync";
import {
  normalizeDestination,
  publishPiece,
  type PublishablePiece,
} from "@/lib/publish-piece";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { createAdminClient } from "@/lib/supabase/admin";

type AgentResult = {
  pieceId: string;
  platform: string;
  status: "posted" | "failed" | "skipped";
  postedUrl?: string | null;
  error?: string;
};

export async function runPostingAgent(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.AGENT_RUN_SECRET ?? process.env.CRON_SECRET;
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(10, Number(url.searchParams.get("limit") ?? "5"))
  );
  const platform = url.searchParams.get("platform");

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("content_pieces")
    .select(
      "id, user_id, platform, format, status, body, validation, metadata, destination_id, destination:platform_destinations(id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata)"
    )
    .eq("status", "approved")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (platform) query = query.eq("platform", platform);

  const { data: pieces, error } = await query;

  if (error) {
    return NextResponse.json({ error: "queue lookup failed" }, { status: 500 });
  }

  const results: AgentResult[] = [];

  for (const piece of (pieces ?? []) as unknown as PublishablePiece[]) {
    const blockedReason = approvalBlockReason(piece);
    if (blockedReason) {
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "skipped",
        error: blockedReason,
      });
      continue;
    }

    const destination = normalizeDestination(piece.destination);
    if (!postingIsConfiguredFor(piece.platform, destination)) {
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "skipped",
        error: missingPostingConfigMessage(piece.platform, destination),
      });
      continue;
    }

    try {
      const result = await publishPiece(piece);
      const postedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("content_pieces")
        .update({
          status: "posted",
          posted_at: postedAt,
          posted_url: result.postedUrl,
          metadata: result.metadata,
        })
        .eq("id", piece.id)
        .eq("status", "approved");

      if (updateError) {
        results.push({
          pieceId: piece.id,
          platform: piece.platform,
          status: "failed",
          error: "Posted, but database update failed.",
        });
      } else {
        await syncRelayPostForContentPiece({
          supabase,
          pieceId: piece.id,
          status: "posted",
          postedAt,
          postedUrl: result.postedUrl,
        });
        results.push({
          pieceId: piece.id,
          platform: piece.platform,
          status: "posted",
          postedUrl: result.postedUrl,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Posting failed.";
      await supabase
        .from("content_pieces")
        .update({
          status: "failed",
          metadata: {
            ...(piece.metadata ?? {}),
            publishError: {
              platform: piece.platform,
              message,
              failedAt: new Date().toISOString(),
              agent: "posting",
            },
          },
        })
        .eq("id", piece.id)
        .eq("status", "approved");
      await syncRelayPostForContentPiece({
        supabase,
        pieceId: piece.id,
        status: "failed",
        errorMessage: message,
      });

      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: now,
    count: results.length,
    results,
  });
}
