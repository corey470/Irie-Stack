export type ApprovalRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ApprovalRequestInput = {
  requestKey: string;
  policySlug: string;
  agentName: string;
  action: string;
  resource: string;
  resourceId: string;
  reason: string;
  riskLevel?: ApprovalRiskLevel;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  callbackUrl?: string;
};

export type ApprovalRequestResult = {
  id: string;
  status: string;
  raw: unknown;
};

export type ApprovalCallbackPayload = {
  id: string;
  requestKey?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | string;
  agentName?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  resolvedAt?: string | null;
};

export function approvalIsConfigured() {
  return Boolean(process.env.APPROVAL_API_URL && process.env.APPROVAL_AGENT_SECRET);
}

export function approvalCallbackUrl() {
  if (process.env.APPROVAL_CALLBACK_URL) return process.env.APPROVAL_CALLBACK_URL;

  const explicitBase = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (explicitBase) return `${explicitBase}/api/approvals/callback`;

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}/api/approvals/callback`;

  return undefined;
}

export async function submitApprovalRequest(
  input: ApprovalRequestInput
): Promise<ApprovalRequestResult> {
  const baseUrl = process.env.APPROVAL_API_URL?.replace(/\/$/, "");
  const secret = process.env.APPROVAL_AGENT_SECRET;

  if (!baseUrl || !secret) {
    throw new Error(
      "Approval API is not configured. Set APPROVAL_API_URL and APPROVAL_AGENT_SECRET."
    );
  }

  const response = await fetch(`${baseUrl}/agent-approvals/requests`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(input),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      raw && typeof raw === "object" && "error" in raw
        ? JSON.stringify(raw.error)
        : `Approval API returned ${response.status}`;
    throw new Error(message);
  }

  const approval = extractApproval(raw);
  if (!approval.id) {
    throw new Error("Approval API returned a response without a request id.");
  }

  return {
    id: approval.id,
    status: approval.status ?? "PENDING",
    raw,
  };
}

function extractApproval(raw: unknown): { id?: string; status?: string } {
  if (!raw || typeof raw !== "object") return {};
  const body = raw as Record<string, unknown>;

  if (typeof body.id === "string") {
    return {
      id: body.id,
      status: typeof body.status === "string" ? body.status : undefined,
    };
  }

  if (body.approvalRequest && typeof body.approvalRequest === "object") {
    const request = body.approvalRequest as Record<string, unknown>;
    return {
      id: typeof request.id === "string" ? request.id : undefined,
      status: typeof request.status === "string" ? request.status : undefined,
    };
  }

  if (typeof body.approvalRequestId === "string") {
    return {
      id: body.approvalRequestId,
      status: typeof body.status === "string" ? body.status : undefined,
    };
  }

  return {};
}
