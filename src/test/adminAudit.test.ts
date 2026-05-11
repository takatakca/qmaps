import { describe, it, expect } from "vitest";
import {
  ADMIN_AUDIT_ACTIONS,
  buildAdminAuditLogPayload,
  isAdminAuditAction,
  summarizeAuditLogs,
} from "@/lib/adminAudit";

describe("adminAudit", () => {
  it("validates known actions", () => {
    expect(isAdminAuditAction("claim_approved")).toBe(true);
    expect(isAdminAuditAction("nope")).toBe(false);
    expect(isAdminAuditAction(42)).toBe(false);
  });

  it("includes the documented actions", () => {
    expect(ADMIN_AUDIT_ACTIONS).toContain("owner_transfer_requested");
    expect(ADMIN_AUDIT_ACTIONS).toContain("report_dismissed");
  });

  it("builds a payload with metadata fallback", () => {
    const p = buildAdminAuditLogPayload({
      adminUserId: "a",
      action: "claim_approved",
      targetType: "business_claim_request",
      targetId: "b",
    });
    expect(p).toEqual({
      admin_user_id: "a",
      action: "claim_approved",
      target_type: "business_claim_request",
      target_id: "b",
      metadata: {},
    });
  });

  it("rejects invalid actions and inputs", () => {
    expect(() =>
      buildAdminAuditLogPayload({ adminUserId: "a", action: "bad" as any, targetType: "x" })
    ).toThrow();
    expect(() =>
      buildAdminAuditLogPayload({ adminUserId: "", action: "claim_approved", targetType: "x" })
    ).toThrow();
  });

  it("summarizes logs by action", () => {
    expect(
      summarizeAuditLogs([
        { action: "claim_approved" },
        { action: "claim_approved" },
        { action: "report_dismissed" },
        { action: "" } as any,
      ])
    ).toEqual({ claim_approved: 2, report_dismissed: 1 });
  });
});
