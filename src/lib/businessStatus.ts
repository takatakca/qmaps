/**
 * Phase 5 — explicit business operating status.
 *
 * Source of truth is `businesses.status` (text, CHECK-constrained).
 * `is_open` and `is_active` are kept in sync for backward compatibility:
 *   - `is_active` continues to gate public visibility / RLS / search filters.
 *   - `is_open` continues to drive the "Ouvert maintenant" pill.
 */

export type BusinessStatus =
  | "open"
  | "temporarily_closed"
  | "permanently_closed"
  | "seasonal"
  | "hidden";

export const BUSINESS_STATUS_VALUES: readonly BusinessStatus[] = [
  "open",
  "temporarily_closed",
  "permanently_closed",
  "seasonal",
  "hidden",
] as const;

export const isBusinessStatus = (v: unknown): v is BusinessStatus =>
  typeof v === "string" && (BUSINESS_STATUS_VALUES as readonly string[]).includes(v);

/**
 * Derive a status from legacy is_open / is_active booleans. Used as a fallback
 * for rows that haven't been touched since the Phase 5 backfill (none in
 * production, but defensive for tests and future restores).
 */
export const deriveLegacyStatus = (input: {
  is_open?: boolean | null;
  is_active?: boolean | null;
}): BusinessStatus => {
  if (input.is_active === false) return "hidden";
  if (input.is_open === false) return "temporarily_closed";
  return "open";
};

/**
 * Read a normalized status from any row shape that may or may not have the
 * `status` column populated.
 */
export const readBusinessStatus = (row: {
  status?: string | null;
  is_open?: boolean | null;
  is_active?: boolean | null;
}): BusinessStatus => {
  if (isBusinessStatus(row.status)) return row.status;
  return deriveLegacyStatus(row);
};

/**
 * Compute the boolean flags that must be written alongside `status` to keep
 * legacy consumers (RLS, search filters, "Open now" pill) coherent.
 */
export const flagsForStatus = (
  status: BusinessStatus,
): { status: BusinessStatus; is_open: boolean; is_active: boolean } => {
  switch (status) {
    case "open":
      return { status, is_open: true, is_active: true };
    case "temporarily_closed":
      return { status, is_open: false, is_active: true };
    case "seasonal":
      return { status, is_open: false, is_active: true };
    case "permanently_closed":
      return { status, is_open: false, is_active: false };
    case "hidden":
      return { status, is_open: false, is_active: false };
  }
};

/** Whether a status should be visible on public pages / search / RLS. */
export const isPubliclyVisibleStatus = (status: BusinessStatus): boolean =>
  status === "open" || status === "temporarily_closed" || status === "seasonal";

export interface StatusLabel {
  label: string;
  shortLabel: string;
  tone: "success" | "warning" | "destructive" | "info" | "muted";
}

/** French labels used in the merchant editor and public profile. */
export const STATUS_LABELS: Record<BusinessStatus, StatusLabel> = {
  open: { label: "Ouvert / En opération", shortLabel: "Ouvert", tone: "success" },
  temporarily_closed: { label: "Temporairement fermé", shortLabel: "Fermé temporairement", tone: "warning" },
  permanently_closed: { label: "Définitivement fermé", shortLabel: "Définitivement fermé", tone: "destructive" },
  seasonal: { label: "Saisonnier / En pause", shortLabel: "Saisonnier", tone: "info" },
  hidden: { label: "Masqué de la liste publique", shortLabel: "Masqué", tone: "muted" },
};
