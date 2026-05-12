import { NextResponse } from "next/server";
import {
  missingPostingConfigMessage,
  postingIsConfiguredFor,
} from "@/lib/posting-config";
import {
  normalizeDestination,
  publishPiece,
  type PublishablePiece,
} from "@/lib/publish-piece";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { createAdminClient } from "@/lib/supabase/admin";

type RelayResult = {
  postId: string;
  sourceApp: string;
  platform: string;
  status: "posted" | "failed" | "skipped";
  postedUrl?: string | null;
  error?: string;
};

export async function runSocialRelayAgent(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.AGENT_RUN_SECRET ?? process.env.CRON_SECRET;
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get("limit") ?? "10")));
  const platform = url.searchParams.get("platform");

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("social_relay_posts")
    .select(
      "id, user_id, source_app, source_record_id, platform, status, body, media, validation, metadata, destination_id, destination:platform_destinations(id, platform, label, external_id, external_type, posting_strategy, access_token_env_key, scheduler_profile_id_env_key, is_default, metadata)"
    )
    .eq("status", "approved")
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order("scheduled_for", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (platform) query = query.eq("platform", platform);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: "relay lookup failed" }, { status: 500 });

  const results: RelayResult[] = [];

  for (const post of (posts ?? []) as unknown as Array<
    PublishablePiece & { source_app: string; source_record_id: string | null }
  >) {
    const blockedReason = approvalBlockReason(post);
    if (blockedReason) {
      results.push({
        postId: post.id,
        sourceApp: post.source_app,
        platform: post.platform,
        status: "skipped",
        error: blockedReason,
      });
      continue;
    }

    const destination = normalizeDestination(post.destination);
    if (!postingIsConfiguredFor(post.platform, destination)) {
      results.push({
        postId: post.id,
        sourceApp: post.source_app,
        platform: post.platform,
        status: "skipped",
        error: missingPostingConfigMessage(post.platform, destination),
      });
      continue;
    }

    try {
      const result = await publishPiece(post);
      const postedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("social_relay_posts")
        .update({
          status: "posted",
          posted_at: postedAt,
          posted_url: result.postedUrl,
          metadata: result.metadata,
          error_message: null,
        })
        .eq("id", post.id)
        .eq("status", "approved");

      if (!updateError && post.source_app === "irie-stack" && post.source_record_id) {
        await supabase
          .from("content_pieces")
          .update({
            status: "posted",
            posted_at: postedAt,
            posted_url: result.postedUrl,
            metadata: result.metadata,
          })
          .eq("id", post.source_record_id);
      }

      results.push({
        postId: post.id,
        sourceApp: post.source_app,
        platform: post.platform,
        status: updateError ? "failed" : "posted",
        postedUrl: updateError ? undefined : result.postedUrl,
        error: updateError ? "Posted, but relay update failed." : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Posting failed.";
      await supabase
        .from("social_relay_posts")
        .update({
          status: "failed",
          error_message: message,
          metadata: {
            ...(post.metadata ?? {}),
            publishError: {
              platform: post.platform,
              message,
              failedAt: new Date().toISOString(),
              agent: "social-relay",
            },
          },
        })
        .eq("id", post.id)
        .eq("status", "approved");

      if (post.source_app === "irie-stack" && post.source_record_id) {
        await supabase
          .from("content_pieces")
          .update({
            status: "failed",
            metadata: {
              ...(post.metadata ?? {}),
              publishError: {
                platform: post.platform,
                message,
                failedAt: new Date().toISOString(),
                agent: "social-relay",
              },
            },
          })
          .eq("id", post.source_record_id);
      }

      results.push({
        postId: post.id,
        sourceApp: post.source_app,
        platform: post.platform,
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
