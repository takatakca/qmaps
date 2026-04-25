/**
 * Phase 9C — Review trust + risk scoring helpers.
 *
 * Pure, dependency-free, deterministic. Safe defaults: a review with no
 * signals is `low` risk and `visible`. Every score is explainable via
 * reason codes and human-readable explanations.
 *
 * IMPORTANT: This is a moderation aid, not proof of fraud. Final
 * decisions stay with admins.
 */

export type ReviewSignalType =
  | "duplicate_text"
  | "repeated_phrase"
  | "extreme_rating"
  | "new_account"
  | "burst_activity"
  | "review_velocity"
  | "same_business_pattern"
  | "short_low_context"
  | "suspicious_language"
  | "merchant_conflict"
  | "user_reported"
  | "ai_flagged"
  | "admin_flagged"
  | "trusted_history";

export type ReviewSeverity = "low" | "medium" | "high" | "critical";
export type ReviewRiskLevel = ReviewSeverity;

export type ReviewModerationStatus =
  | "visible"
  | "needs_review"
  | "hidden"
  | "trusted"
  | "dismissed"
  | "restored";

export interface ReviewSignal {
  signal_type: ReviewSignalType;
  severity: ReviewSeverity;
  score: number;
  explanation: string;
  metadata?: Record<string, unknown>;
}

/**
 * Per-signal contribution to risk_score. Negative = lowers risk
 * (e.g. trusted_history). Final risk_score is clamped 0–100.
 */
export const SIGNAL_WEIGHTS: Record<ReviewSignalType, number> = {
  duplicate_text: 35,
  repeated_phrase: 15,
  extreme_rating: 10,
  new_account: 12,
  burst_activity: 20,
  review_velocity: 15,
  same_business_pattern: 25,
  short_low_context: 8,
  suspicious_language: 12,
  merchant_conflict: 18,
  user_reported: 10,
  ai_flagged: 20,
  admin_flagged: 40,
  trusted_history: -25,
};

const SEVERITY_MULTIPLIER: Record<ReviewSeverity, number> = {
  low: 0.5,
  medium: 1,
  high: 1.5,
  critical: 2,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Map a 0–100 risk score to a level. */
export const calculateRiskLevel = (riskScore: number): ReviewRiskLevel => {
  const s = clamp(Number(riskScore) || 0, 0, 100);
  if (s >= 75) return "critical";
  if (s >= 50) return "high";
  if (s >= 25) return "medium";
  return "low";
};

export interface RiskScoreResult {
  risk_score: number;
  trust_score: number;
  risk_level: ReviewRiskLevel;
  applied: ReviewSignal[];
  summary: string;
}

/** Compose final risk + trust score from a list of signals. */
export const computeRiskFromSignals = (signals: ReviewSignal[]): RiskScoreResult => {
  const applied = (signals ?? []).filter(Boolean);
  let raw = 0;
  for (const sig of applied) {
    const base = SIGNAL_WEIGHTS[sig.signal_type] ?? 0;
    const mult = SEVERITY_MULTIPLIER[sig.severity] ?? 1;
    // Use signal's own score if explicitly provided (>0), else base*mult.
    const contribution =
      typeof sig.score === "number" && sig.score !== 0 ? sig.score : base * mult;
    raw += contribution;
  }

  const risk_score = clamp(Math.round(raw), 0, 100);
  const trust_score = Number(((100 - risk_score) / 100).toFixed(3));
  const risk_level = calculateRiskLevel(risk_score);
  const summary = formatRiskExplanationAdmin(applied, risk_level);

  return { risk_score, trust_score, risk_level, applied, summary };
};

/** Public-safe wording (never reveals private signal types or accuses). */
export const formatRiskLevelPublic = (level: ReviewRiskLevel): string => {
  switch (level) {
    case "critical":
      return "En cours de vérification";
    case "high":
      return "En cours de vérification";
    case "medium":
      return "Vérification en cours";
    default:
      return "Vérifié";
  }
};

/** Admin-facing label. */
export const formatRiskLevelAdmin = (level: ReviewRiskLevel): string => {
  switch (level) {
    case "critical":
      return "Risque critique";
    case "high":
      return "Risque élevé";
    case "medium":
      return "Risque modéré";
    default:
      return "Risque faible";
  }
};

/** Color token (semantic) for admin badges. */
export const riskLevelTone = (level: ReviewRiskLevel): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case "critical":
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
};

/** Build admin-readable summary explaining the score. */
export const formatRiskExplanationAdmin = (
  signals: ReviewSignal[],
  level: ReviewRiskLevel
): string => {
  if (!signals || signals.length === 0) {
    return "Aucun signal détecté. Avis considéré comme à risque faible.";
  }
  const parts = signals
    .slice(0, 4)
    .map((s) => `• ${humanSignalType(s.signal_type)} (${s.severity}) — ${s.explanation}`);
  return `${formatRiskLevelAdmin(level)}\n${parts.join("\n")}`;
};

/** Human label for a signal type (admin UI). */
export const humanSignalType = (type: ReviewSignalType): string => {
  const labels: Record<ReviewSignalType, string> = {
    duplicate_text: "Texte dupliqué",
    repeated_phrase: "Phrase répétée",
    extreme_rating: "Note extrême",
    new_account: "Nouveau compte",
    burst_activity: "Activité en rafale",
    review_velocity: "Vitesse de publication",
    same_business_pattern: "Modèle d'avis répété",
    short_low_context: "Contenu très court",
    suspicious_language: "Langage suspect",
    merchant_conflict: "Conflit avec le marchand",
    user_reported: "Signalé par un utilisateur",
    ai_flagged: "Détecté par l'IA",
    admin_flagged: "Marqué par un admin",
    trusted_history: "Historique fiable",
  };
  return labels[type] ?? type;
};

// ---------------------------------------------------------------------------
// Local deterministic detectors. Pure functions on whatever the caller has.
// ---------------------------------------------------------------------------

export interface LocalReviewInput {
  body?: string | null;
  rating?: number | null;
  user_created_at?: string | null; // ISO
  user_review_count_last_24h?: number | null;
  user_review_count_total?: number | null;
  business_review_count_last_24h?: number | null;
  same_text_count_by_user?: number | null;
}

const wordCount = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const computeLocalReviewSignals = (input: LocalReviewInput): ReviewSignal[] => {
  const signals: ReviewSignal[] = [];
  const body = (input.body ?? "").toString();
  const rating = Number(input.rating ?? 0);

  // 1. Extreme rating with very short body
  if ((rating === 1 || rating === 5) && body.length > 0 && wordCount(body) <= 5) {
    signals.push({
      signal_type: "extreme_rating",
      severity: "medium",
      score: 0,
      explanation: "Note extrême avec très peu de contexte.",
    });
    signals.push({
      signal_type: "short_low_context",
      severity: "low",
      score: 0,
      explanation: `Avis de ${wordCount(body)} mot(s).`,
    });
  } else if (body.length > 0 && wordCount(body) <= 3) {
    signals.push({
      signal_type: "short_low_context",
      severity: "low",
      score: 0,
      explanation: "Avis très court.",
    });
  }

  // 2. New account
  if (input.user_created_at) {
    const ageHours =
      (Date.now() - new Date(input.user_created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours >= 0 && ageHours < 24) {
      signals.push({
        signal_type: "new_account",
        severity: rating === 1 || rating === 5 ? "high" : "medium",
        score: 0,
        explanation: "Compte créé il y a moins de 24 h.",
      });
    } else if (ageHours < 24 * 7) {
      signals.push({
        signal_type: "new_account",
        severity: "low",
        score: 0,
        explanation: "Compte créé il y a moins de 7 jours.",
      });
    }
  }

  // 3. Burst activity by user
  const userBurst = Number(input.user_review_count_last_24h ?? 0);
  if (userBurst >= 5) {
    signals.push({
      signal_type: "burst_activity",
      severity: "high",
      score: 0,
      explanation: `Utilisateur a publié ${userBurst} avis dans les 24 dernières heures.`,
    });
  } else if (userBurst >= 3) {
    signals.push({
      signal_type: "review_velocity",
      severity: "medium",
      score: 0,
      explanation: `Utilisateur a publié ${userBurst} avis dans les 24 dernières heures.`,
    });
  }

  // 4. Burst on same business
  const bizBurst = Number(input.business_review_count_last_24h ?? 0);
  if (bizBurst >= 10) {
    signals.push({
      signal_type: "same_business_pattern",
      severity: "high",
      score: 0,
      explanation: `${bizBurst} avis sur ce commerce dans les 24 dernières heures.`,
    });
  }

  // 5. Duplicate text by same user across businesses
  const dupes = Number(input.same_text_count_by_user ?? 0);
  if (dupes >= 2) {
    signals.push({
      signal_type: "duplicate_text",
      severity: dupes >= 4 ? "critical" : "high",
      score: 0,
      explanation: `Texte identique posté ${dupes} fois par cet utilisateur.`,
    });
  }

  // 6. Trusted history (positive signal): many total reviews, none flagged
  const total = Number(input.user_review_count_total ?? 0);
  if (total >= 25 && userBurst <= 1) {
    signals.push({
      signal_type: "trusted_history",
      severity: "low",
      score: 0,
      explanation: `Historique fiable: ${total} avis publiés.`,
    });
  }

  return signals;
};

/** Convenience: compute a result from a raw input directly. */
export const scoreReviewLocally = (input: LocalReviewInput): RiskScoreResult =>
  computeRiskFromSignals(computeLocalReviewSignals(input));
