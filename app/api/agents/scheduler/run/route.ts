import { NextResponse } from "next/server";
import { approvalIsConfigured } from "@/lib/approval-client";
import { requestPieceApproval, type ApprovalPiece } from "@/lib/approval-requests";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { syncRelayPostForContentPiece } from "@/lib/relay-sync";
import { createAdminClient } from "@/lib/supabase/admin";

type PlatformSetting = {
  user_id: string;
  platform: string;
  mode: "approval" | "autopilot" | "paused";
  is_enabled: boolean;
};

type SchedulerResult = {
  pieceId: string;
  platform: string;
  status: "approved" | "pending_approval" | "paused" | "blocked" | "failed";
  error?: string;
};

export async function POST(req: Request) {
  return runScheduler(req);
}

export async function GET(req: Request) {
  return runScheduler(req);
}

async function runScheduler(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.AGENT_RUN_SECRET ?? process.env.CRON_SECRET;
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(25, Number(url.searchParams.get("limit") ?? "10"))
  );

  const supabase = createAdminClient();
  const { data: pieces, error } = await supabase
    .from("content_pieces")
    .select(
      "id, user_id, run_id, platform, level, format, title, body, slides, scheduled_for, validation, metadata"
    )
    .eq("status", "draft")
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "draft lookup failed" }, { status: 500 });
  }

  const typedPieces = (pieces ?? []) as (ApprovalPiece & { user_id: string })[];
  const userIds = [...new Set(typedPieces.map((piece) => piece.user_id))];
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("user_id, platform, mode, is_enabled")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const settingsMap = new Map(
    ((settings ?? []) as PlatformSetting[]).map((setting) => [
      `${setting.user_id}:${setting.platform}`,
      setting,
    ])
  );

  const results: SchedulerResult[] = [];

  for (const piece of typedPieces) {
    if (piece.validation?.ok === false) {
      await supabase
        .from("content_pieces")
        .update({ status: "failed" })
        .eq("id", piece.id)
        .eq("status", "draft");
      await syncRelayPostForContentPiece({
        supabase,
        pieceId: piece.id,
        status: "failed",
        errorMessage: "validation errors",
      });
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "failed",
        error: "validation errors",
      });
      continue;
    }

    const blockedReason = approvalBlockReason(piece);
    if (blockedReason) {
      await supabase
        .from("content_pieces")
        .update({
          mode: "approval",
          metadata: {
            ...(piece.metadata ?? {}),
            scheduler: {
              status: "blocked",
              reason: blockedReason,
              checkedAt: new Date().toISOString(),
            },
          },
        })
        .eq("id", piece.id)
        .eq("status", "draft");
      await syncRelayPostForContentPiece({
        supabase,
        pieceId: piece.id,
        status: "draft",
        mode: "approval",
        errorMessage: blockedReason,
      });
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "blocked",
        error: blockedReason,
      });
      continue;
    }

    const setting = settingsMap.get(`${piece.user_id}:${piece.platform}`);
    const mode = setting?.is_enabled === false ? "paused" : setting?.mode ?? "approval";

    if (mode === "paused") {
      await supabase
        .from("content_pieces")
        .update({
          mode: "approval",
          metadata: {
            ...(piece.metadata ?? {}),
            scheduler: {
              status: "paused",
              checkedAt: new Date().toISOString(),
            },
          },
        })
        .eq("id", piece.id)
        .eq("status", "draft");
      await syncRelayPostForContentPiece({
        supabase,
        pieceId: piece.id,
        status: "draft",
        mode: "approval",
      });
      results.push({ pieceId: piece.id, platform: piece.platform, status: "paused" });
      continue;
    }

    if (mode === "autopilot") {
      await supabase
        .from("content_pieces")
        .update({
          status: "approved",
          approval_status: "approved",
          mode: "autopilot",
          metadata: {
            ...(piece.metadata ?? {}),
            scheduler: {
              status: "autopilot_approved",
              checkedAt: new Date().toISOString(),
            },
          },
        })
        .eq("id", piece.id)
        .eq("status", "draft");
      await syncRelayPostForContentPiece({
        supabase,
        pieceId: piece.id,
        status: "approved",
        mode: "autopilot",
      });
      results.push({ pieceId: piece.id, platform: piece.platform, status: "approved" });
      continue;
    }

    if (!approvalIsConfigured()) {
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "failed",
        error: "approval api not configured",
      });
      continue;
    }

    try {
      const approval = await requestPieceApproval(piece);
      await supabase
        .from("content_pieces")
        .update({
          status: "pending_approval",
          approval_status: approval.status.toLowerCase(),
          approval_request_id: approval.id,
          mode: "approval",
          metadata: {
            ...(piece.metadata ?? {}),
            approval: {
              requestId: approval.id,
              status: approval.status,
              requestedAt: new Date().toISOString(),
              policySlug: process.env.APPROVAL_POLICY_SLUG ?? "publish-social-post",
            },
          },
        })
        .eq("id", piece.id)
        .eq("status", "draft");
      await syncRelayPostForContentPiece({
        supabase,
        pieceId: piece.id,
        status: "pending_approval",
        mode: "approval",
      });
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "pending_approval",
      });
    } catch (err) {
      results.push({
        pieceId: piece.id,
        platform: piece.platform,
        status: "failed",
        error: err instanceof Error ? err.message : "approval request failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    count: results.length,
    results,
  });
}
