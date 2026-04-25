/**
 * Phase 10C — account deletion helpers.
 * Pure helpers only. Database operations live in the page components.
 */

export const DELETE_CONFIRMATION_TOKEN = "DELETE";

export type AccountDeletionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "canceled"
  | "rejected";

export const ACCOUNT_DELETION_STATUSES: AccountDeletionStatus[] = [
  "pending",
  "processing",
  "completed",
  "canceled",
  "rejected",
];

/**
 * Validates the user's confirmation token before submitting a deletion request.
 * Trims whitespace and requires an exact case-sensitive match against DELETE.
 */
export const isDeletionConfirmationValid = (input: string): boolean => {
  if (typeof input !== "string") return false;
  return input.trim() === DELETE_CONFIRMATION_TOKEN;
};

export const isValidDeletionStatus = (
  value: string,
): value is AccountDeletionStatus =>
  (ACCOUNT_DELETION_STATUSES as string[]).includes(value);

export const STATUS_LABELS_FR: Record<AccountDeletionStatus, string> = {
  pending: "En attente",
  processing: "En traitement",
  completed: "Complétée",
  canceled: "Annulée",
  rejected: "Refusée",
};
