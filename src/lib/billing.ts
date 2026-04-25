// Phase 7 — Billing helpers, plan definitions, and feature gates.
// Additive only. Used for labels, upgrade prompts and merchant UI.

export type PlanKey = "free" | "starter" | "pro" | "premium";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "free";

export type FeatureKey =
  | "analytics_30d"
  | "project_leads"
  | "advanced_profile"
  | "multi_location"
  | "sponsored_visibility_placeholder";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  tagline: string;
  priceLabel: string;
  features: string[];
  cta: "current" | "coming_soon" | "contact" | "upgrade" | "checkout";
  highlighted?: boolean;
  /** Whether this plan can be purchased through a payment provider checkout flow. */
  checkoutEligible?: boolean;
}

export const PLANS: PlanDefinition[] = [
  {
    key: "free",
    name: "Gratuit",
    tagline: "Pour commencer sur QMaps",
    priceLabel: "0 $ / mois",
    features: [
      "Fiche d'entreprise de base",
      "Réception des avis clients",
      "Statistiques limitées",
    ],
    cta: "current",
  },
  {
    key: "starter",
    name: "Starter",
    tagline: "Pour les petites entreprises actives",
    priceLabel: "Bientôt disponible",
    features: [
      "Profil enrichi",
      "Statistiques sur 30 jours",
      "Demandes de projets (leads)",
    ],
    cta: "coming_soon",
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Pour les commerces qui veulent plus de visibilité",
    priceLabel: "Bientôt disponible",
    features: [
      "Support prioritaire",
      "Statistiques avancées",
      "Outils de gestion des leads",
    ],
    cta: "coming_soon",
    highlighted: true,
  },
  {
    key: "premium",
    name: "Premium",
    tagline: "Pour les chaînes et multi-emplacements",
    priceLabel: "Sur demande",
    features: [
      "Outils multi-emplacements",
      "Visibilité avancée",
      "Placements sponsorisés (à venir)",
    ],
    cta: "contact",
  },
];

const PLAN_RANK: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  premium: 3,
};

const FEATURE_MIN_PLAN: Record<FeatureKey, PlanKey> = {
  analytics_30d: "starter",
  project_leads: "starter",
  advanced_profile: "starter",
  multi_location: "premium",
  sponsored_visibility_placeholder: "premium",
};

export function canAccessFeature(
  plan: PlanKey | null | undefined,
  feature: FeatureKey
): boolean {
  const current = plan ?? "free";
  return PLAN_RANK[current] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function planLabel(plan: PlanKey | null | undefined): string {
  const found = PLANS.find((p) => p.key === (plan ?? "free"));
  return found?.name ?? "Gratuit";
}

export function statusLabel(status: SubscriptionStatus | null | undefined): string {
  switch (status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Essai en cours";
    case "past_due":
      return "Paiement en retard";
    case "canceled":
      return "Annulé";
    case "incomplete":
      return "Incomplet";
    case "free":
    default:
      return "Gratuit";
  }
}

export function isProOrBetter(plan: PlanKey | null | undefined): boolean {
  return PLAN_RANK[plan ?? "free"] >= PLAN_RANK.pro;
}
