export type OwnerTransferStatus = "pending" | "approved" | "rejected";

export const OWNER_TRANSFER_STATUSES: OwnerTransferStatus[] = ["pending", "approved", "rejected"];

export const OWNER_TRANSFER_STATUS_LABELS: Record<OwnerTransferStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

export interface BuildOwnerTransferRequestInput {
  businessId: string;
  requestedOwnerUserId: string;
  currentOwnerUserId?: string | null;
  claimRequestId?: string | null;
  reason?: string | null;
}

export interface OwnerTransferRequestInsert {
  business_id: string;
  requested_owner_user_id: string;
  current_owner_user_id: string | null;
  claim_request_id: string | null;
  reason: string | null;
  status: "pending";
}

export function buildOwnerTransferRequest(
  input: BuildOwnerTransferRequestInput
): OwnerTransferRequestInsert {
  if (!input.businessId) throw new Error("businessId required");
  if (!input.requestedOwnerUserId) throw new Error("requestedOwnerUserId required");
  if (
    input.currentOwnerUserId &&
    input.currentOwnerUserId === input.requestedOwnerUserId
  ) {
    throw new Error("requested owner is already the current owner");
  }
  return {
    business_id: input.businessId,
    requested_owner_user_id: input.requestedOwnerUserId,
    current_owner_user_id: input.currentOwnerUserId ?? null,
    claim_request_id: input.claimRequestId ?? null,
    reason: input.reason?.trim() || null,
    status: "pending",
  };
}

export function isValidOwnerTransferStatus(s: unknown): s is OwnerTransferStatus {
  return typeof s === "string" && OWNER_TRANSFER_STATUSES.includes(s as OwnerTransferStatus);
}
