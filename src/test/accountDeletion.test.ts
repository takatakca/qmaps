import { describe, it, expect } from "vitest";
import {
  isDeletionConfirmationValid,
  isValidDeletionStatus,
  DELETE_CONFIRMATION_TOKEN,
  ACCOUNT_DELETION_STATUSES,
} from "@/lib/accountDeletion";

describe("accountDeletion helpers", () => {
  describe("isDeletionConfirmationValid", () => {
    it("accepts the exact token", () => {
      expect(isDeletionConfirmationValid("DELETE")).toBe(true);
    });

    it("trims surrounding whitespace", () => {
      expect(isDeletionConfirmationValid("  DELETE  ")).toBe(true);
      expect(isDeletionConfirmationValid("\nDELETE\t")).toBe(true);
    });

    it("rejects wrong case", () => {
      expect(isDeletionConfirmationValid("delete")).toBe(false);
      expect(isDeletionConfirmationValid("Delete")).toBe(false);
    });

    it("rejects partial or extra content", () => {
      expect(isDeletionConfirmationValid("DEL")).toBe(false);
      expect(isDeletionConfirmationValid("DELETE ME")).toBe(false);
      expect(isDeletionConfirmationValid("")).toBe(false);
    });

    it("rejects non-string input", () => {
      expect(isDeletionConfirmationValid(null as unknown as string)).toBe(false);
      expect(isDeletionConfirmationValid(undefined as unknown as string)).toBe(false);
      expect(isDeletionConfirmationValid(123 as unknown as string)).toBe(false);
    });

    it("token is the documented constant", () => {
      expect(DELETE_CONFIRMATION_TOKEN).toBe("DELETE");
    });
  });

  describe("isValidDeletionStatus", () => {
    it("accepts all known statuses", () => {
      for (const status of ACCOUNT_DELETION_STATUSES) {
        expect(isValidDeletionStatus(status)).toBe(true);
      }
    });

    it("rejects unknown values", () => {
      expect(isValidDeletionStatus("deleted")).toBe(false);
      expect(isValidDeletionStatus("")).toBe(false);
      expect(isValidDeletionStatus("PENDING")).toBe(false);
    });
  });
});
