export type SignalSeverity = "low" | "medium" | "high";

export interface ModerationSignal {
  id: string;
  label: string;
  severity: SignalSeverity;
}

export interface ReviewLike {
  id?: string;
  body?: string | null;
  rating?: number | null;
  user_id?: string | null;
  business_id?: string | null;
}

export interface ReviewSignalContext {
  userRecentReviews?: ReviewLike[];
  duplicateBodyForBusiness?: boolean;
}

const SUSPICIOUS_LINK_RE = /(https?:\/\/|www\.)\S+/i;
const REPEATED_CHAR_RE = /(.)\1{4,}/;

export function getReviewModerationSignals(
  review: ReviewLike,
  context: ReviewSignalContext = {},
): ModerationSignal[] {
  const out: ModerationSignal[] = [];
  const body = (review.body ?? "").trim();
  const rating = review.rating ?? 0;

  if (body.length > 0 && body.length < 10) {
    out.push({ id: "very_short_text", label: "Texte très court", severity: "low" });
  }
  if (REPEATED_CHAR_RE.test(body)) {
    out.push({ id: "repeated_chars", label: "Caractères répétés", severity: "low" });
  }
  if (SUSPICIOUS_LINK_RE.test(body)) {
    out.push({ id: "suspicious_link", label: "Lien suspect", severity: "medium" });
  }
  if ((rating === 1 || rating === 5) && body.length === 0) {
    out.push({ id: "extreme_rating_no_text", label: "Note extrême sans texte", severity: "medium" });
  }

  const recent = context.userRecentReviews ?? [];
  if (recent.length >= 5) {
    out.push({ id: "burst_reviews", label: "Plusieurs avis récents", severity: "medium" });
  }
  if (context.duplicateBodyForBusiness) {
    out.push({ id: "duplicate_body", label: "Texte dupliqué", severity: "high" });
  }
  return out;
}

export interface BusinessSignalContext {
  reportCount?: number;
  duplicateReportText?: boolean;
  claimCount?: number;
  claimEmailDomainMismatch?: boolean;
}

export function getBusinessModerationSignals(
  _business: { id?: string; website?: string | null } | null | undefined,
  context: BusinessSignalContext = {},
): ModerationSignal[] {
  const out: ModerationSignal[] = [];
  if ((context.reportCount ?? 0) >= 3) {
    out.push({ id: "many_reports", label: "Plusieurs signalements", severity: "high" });
  }
  if (context.duplicateReportText) {
    out.push({ id: "duplicate_report_text", label: "Signalements dupliqués", severity: "medium" });
  }
  if ((context.claimCount ?? 0) >= 3) {
    out.push({ id: "many_claims", label: "Plusieurs revendications", severity: "medium" });
  }
  if (context.claimEmailDomainMismatch) {
    out.push({ id: "claim_domain_mismatch", label: "Domaine email ≠ site web", severity: "medium" });
  }
  return out;
}

export function scoreModerationSignals(signals: ModerationSignal[]): {
  score: number;
  level: SignalSeverity;
} {
  let score = 0;
  for (const s of signals) {
    score += s.severity === "high" ? 5 : s.severity === "medium" ? 2 : 1;
  }
  const level: SignalSeverity = score >= 5 ? "high" : score >= 2 ? "medium" : "low";
  return { score, level };
}
