import {
  approvalCallbackUrl,
  submitApprovalRequest,
  type ApprovalRequestResult,
} from "@/lib/approval-client";

export type ApprovalPiece = {
  id: string;
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

export async function requestPieceApproval(
  piece: ApprovalPiece
): Promise<ApprovalRequestResult> {
  const requestKey = `iriestack:${piece.id}:publish`;
  const policySlug = process.env.APPROVAL_POLICY_SLUG ?? "publish-social-post";

  return await submitApprovalRequest({
    requestKey,
    policySlug,
    agentName: "IrieStack",
    action: "publish",
    resource: "social_post",
    resourceId: piece.id,
    reason: `Approve ${piece.platform} ${piece.format} for publishing.`,
    riskLevel: "HIGH",
    metadata: {
      sourceProduct: "irie-stack",
      runId: piece.run_id,
      pieceId: piece.id,
      platform: piece.platform,
      level: piece.level,
      format: piece.format,
      scheduledFor: piece.scheduled_for,
    },
    context: {
      title: piece.title,
      body: piece.body,
      slides: piece.slides,
      validation: piece.validation,
    },
    callbackUrl: approvalCallbackUrl(),
  });
}
