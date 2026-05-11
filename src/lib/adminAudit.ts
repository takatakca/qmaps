export const ADMIN_AUDIT_ACTIONS = [
  "claim_approved",
  "claim_rejected",
  "owner_transfer_requested",
  "owner_transfer_approved",
  "owner_transfer_rejected",
  "report_reviewed",
  "report_dismissed",
  "business_verified",
  "business_unverified",
  "business_updated_by_admin",
  "category_created",
  "category_updated",
  "category_deactivated",
  "category_reactivated",
  "review_hidden",
  "review_restored",
  "review_reviewed",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_AUDIT_ACTION_LABELS: Record<AdminAuditAction, string> = {
  claim_approved: "Revendication approuvée",
  claim_rejected: "Revendication rejetée",
  owner_transfer_requested: "Transfert demandé",
  owner_transfer_approved: "Transfert approuvé",
  owner_transfer_rejected: "Transfert rejeté",
  report_reviewed: "Signalement traité",
  report_dismissed: "Signalement rejeté",
  business_verified: "Commerce vérifié",
  business_unverified: "Commerce dévérifié",
  business_updated_by_admin: "Commerce modifié",
};

export function isAdminAuditAction(action: unknown): action is AdminAuditAction {
  return typeof action === "string" && (ADMIN_AUDIT_ACTIONS as readonly string[]).includes(action);
}

export interface AdminAuditLogInput {
  adminUserId: string;
  action: AdminAuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AdminAuditLogPayload {
  admin_user_id: string;
  action: AdminAuditAction;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
}

export function buildAdminAuditLogPayload(input: AdminAuditLogInput): AdminAuditLogPayload {
  if (!input.adminUserId) throw new Error("adminUserId required");
  if (!isAdminAuditAction(input.action)) throw new Error(`invalid action: ${String(input.action)}`);
  if (!input.targetType) throw new Error("targetType required");
  return {
    admin_user_id: input.adminUserId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  };
}

export interface AuditLogLike {
  action: string;
}

export function summarizeAuditLogs(logs: AuditLogLike[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of logs ?? []) {
    if (!l || typeof l.action !== "string" || l.action.length === 0) continue;
    counts[l.action] = (counts[l.action] ?? 0) + 1;
  }
  return counts;
}
