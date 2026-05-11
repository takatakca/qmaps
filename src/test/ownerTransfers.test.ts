import { describe, it, expect } from "vitest";
import { buildOwnerTransferRequest, isValidOwnerTransferStatus } from "@/lib/ownerTransfers";

describe("ownerTransfers", () => {
  it("builds insert payload", () => {
    expect(
      buildOwnerTransferRequest({
        businessId: "b",
        requestedOwnerUserId: "u2",
        currentOwnerUserId: "u1",
        claimRequestId: "c",
        reason: "  reassign  ",
      })
    ).toEqual({
      business_id: "b",
      requested_owner_user_id: "u2",
      current_owner_user_id: "u1",
      claim_request_id: "c",
      reason: "reassign",
      status: "pending",
    });
  });

  it("rejects same-owner transfers", () => {
    expect(() =>
      buildOwnerTransferRequest({
        businessId: "b",
        requestedOwnerUserId: "u",
        currentOwnerUserId: "u",
      })
    ).toThrow();
  });

  it("validates statuses", () => {
    expect(isValidOwnerTransferStatus("pending")).toBe(true);
    expect(isValidOwnerTransferStatus("approved")).toBe(true);
    expect(isValidOwnerTransferStatus("foo")).toBe(false);
  });
});
