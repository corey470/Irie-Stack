import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-auth";
import { approvalIsConfigured } from "@/lib/approval-client";
import { requestPieceApproval } from "@/lib/approval-requests";
import { approvalBlockReason } from "@/lib/post-eligibility";
import { syncRelayPostForContentPiece } from "@/lib/relay-sync";

type PieceRow = {
  id: string;
  user_id: string;
  run_id: string;
  platform: string;
  level: string;
  format: string;
  title: string;
  body: string;
  slides: unknown;
  scheduled_for: string | null;
  validation: { ok?: boolean; errors?: string[]; warnings?: string[] } | null;
  metadata: Record<string, unknown> | null;
};

export async function POST(req: Request) {
  const { supabase, user } = await getAppContext();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { pieceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.pieceId) {
    return NextResponse.json({ error: "pieceId is required" }, { status: 400 });
  }

  if (!approvalIsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Approval API is not configured. Set APPROVAL_API_URL and APPROVAL_AGENT_SECRET.",
      },
      { status: 503 }
    );
  }

  const { data: piece, error: pieceError } = await supabase
    .from("content_pieces")
    .select(
      "id, user_id, run_id, platform, level, format, title, body, slides, scheduled_for, validation, metadata"
    )
    .eq("id", body.pieceId)
    .eq("user_id", user.id)
    .single();

  if (pieceError || !piece) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const typedPiece = piece as PieceRow;
  if (typedPiece.validation?.ok === false) {
    return NextResponse.json(
      { error: "Fix validation errors before requesting approval." },
      { status: 422 }
    );
  }
  const blockedReason = approvalBlockReason(typedPiece);
  if (blockedReason) {
    return NextResponse.json({ error: blockedReason }, { status: 422 });
  }

  const policySlug = process.env.APPROVAL_POLICY_SLUG ?? "publish-social-post";

  let approval;
  try {
    approval = await requestPieceApproval(typedPiece);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Approval request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const metadata = {
    ...(typedPiece.metadata ?? {}),
    approval: {
      requestId: approval.id,
      status: approval.status,
      requestedAt: new Date().toISOString(),
      policySlug,
    },
  };

  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      status: "pending_approval",
      approval_request_id: approval.id,
      approval_status: approval.status.toLowerCase(),
      metadata,
    })
    .eq("id", typedPiece.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Approval created, but piece update failed." },
      { status: 500 }
    );
  }

  await syncRelayPostForContentPiece({
    supabase,
    pieceId: typedPiece.id,
    status: "pending_approval",
    mode: "approval",
  });

  return NextResponse.json({
    ok: true,
    pieceId: typedPiece.id,
    approvalRequestId: approval.id,
    approvalStatus: approval.status,
  });
}
