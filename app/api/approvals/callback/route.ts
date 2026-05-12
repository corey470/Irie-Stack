import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyHmacSha256 } from "@/lib/signatures";
import type { ApprovalCallbackPayload } from "@/lib/approval-client";
import { syncRelayPostForContentPiece } from "@/lib/relay-sync";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-approval-signature");

  if (
    !verifyHmacSha256({
      body: rawBody,
      signature,
      secret: process.env.APPROVAL_CALLBACK_SIGNING_SECRET,
    })
  ) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: ApprovalCallbackPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "missing approval id" }, { status: 400 });
  }

  const normalized = normalizeStatus(payload.status);
  const pieceStatus =
    normalized === "approved"
      ? "approved"
      : normalized === "rejected"
        ? "rejected"
        : "pending_approval";

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("content_pieces")
    .select("id, metadata")
    .eq("approval_request_id", payload.id)
    .maybeSingle();

  const metadata =
    existing?.metadata && typeof existing.metadata === "object"
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("content_pieces")
    .update({
      status: pieceStatus,
      approval_status: normalized,
      metadata: {
        ...metadata,
        approval: {
          ...(metadata.approval && typeof metadata.approval === "object"
            ? (metadata.approval as Record<string, unknown>)
            : {}),
          requestId: payload.id,
          status: payload.status,
          resolvedAt: payload.resolvedAt ?? null,
          approvedAt: payload.approvedAt ?? null,
          rejectedAt: payload.rejectedAt ?? null,
          callbackReceivedAt: new Date().toISOString(),
        },
      },
    })
    .eq("approval_request_id", payload.id);

  if (error) {
    return NextResponse.json({ error: "piece update failed" }, { status: 500 });
  }

  if (existing?.id) {
    await syncRelayPostForContentPiece({
      supabase,
      pieceId: existing.id as string,
      status: pieceStatus,
      mode: "approval",
    });
  }

  return NextResponse.json({ ok: true, approvalRequestId: payload.id });
}

function normalizeStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "expired") return "expired";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  return "pending";
}
