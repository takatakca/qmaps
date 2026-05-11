/**
 * Pure helpers for the public claim request flow.
 */

export interface ClaimRequestInput {
  contact_name: string;
  business_email: string;
  business_phone?: string;
  message?: string;
  evidence_url?: string;
}

export interface NormalizedClaimRequest {
  contact_name: string;
  business_email: string;
  business_phone: string | null;
  message: string | null;
  evidence_url: string | null;
}

export const isValidEmail = (email: unknown): email is string => {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  // Pragmatic email regex (not RFC 5322 perfect)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
};

export const isValidOptionalUrl = (url: unknown): boolean => {
  if (url === undefined || url === null || url === "") return true;
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const normalizeClaimRequestInput = (input: ClaimRequestInput): NormalizedClaimRequest => {
  const t = (s?: string) => (s ?? "").trim();
  const optional = (s?: string) => {
    const v = t(s);
    return v ? v : null;
  };
  return {
    contact_name: t(input.contact_name).slice(0, 100),
    business_email: t(input.business_email).slice(0, 254),
    business_phone: optional(input.business_phone)?.slice(0, 30) ?? null,
    message: optional(input.message)?.slice(0, 500) ?? null,
    evidence_url: optional(input.evidence_url)?.slice(0, 500) ?? null,
  };
};

export type ClaimRequestValidationError =
  | "missing_contact_name"
  | "missing_email"
  | "invalid_email"
  | "invalid_evidence_url";

export const canSubmitClaimRequest = (
  input: ClaimRequestInput,
): { ok: true; data: NormalizedClaimRequest } | { ok: false; error: ClaimRequestValidationError } => {
  const data = normalizeClaimRequestInput(input);
  if (!data.contact_name) return { ok: false, error: "missing_contact_name" };
  if (!data.business_email) return { ok: false, error: "missing_email" };
  if (!isValidEmail(data.business_email)) return { ok: false, error: "invalid_email" };
  if (!isValidOptionalUrl(data.evidence_url ?? undefined)) return { ok: false, error: "invalid_evidence_url" };
  return { ok: true, data };
};
