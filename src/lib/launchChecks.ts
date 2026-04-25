/**
 * Phase 13A — Launch check definitions.
 *
 * Pure helpers that describe the release-candidate checklist used by both:
 *   - the in-app /admin/launch-status dashboard
 *   - docs/release-candidate-checklist.md (kept in sync manually)
 *
 * No side effects, no React, no fetch. Runtime status is layered on top
 * by the consuming UI.
 */

export type LaunchCheckState = "ok" | "fail" | "manual" | "unknown";

export type LaunchCheckGroupId =
  | "pwa"
  | "legal"
  | "env"
  | "stripe"
  | "tests";

export interface LaunchCheckItem {
  /** Stable id, useful for tests and runtime status maps. */
  id: string;
  /** Human-readable label shown in the admin UI. */
  label: string;
  /** Default state when no runtime signal is available. */
  defaultState: LaunchCheckState;
  /** Optional path/URL the item refers to (used by the UI to fetch). */
  path?: string;
  /** Optional helper text shown under the row. */
  detail?: string;
}

export interface LaunchCheckGroup {
  id: LaunchCheckGroupId;
  title: string;
  items: LaunchCheckItem[];
}

export const LEGAL_ROUTES = [
  "/privacy",
  "/terms",
  "/cookies",
  "/account-deletion-policy",
  "/support-policy",
] as const;

export const PWA_ASSETS = [
  { id: "manifest", label: "Manifest (/manifest.webmanifest)", path: "/manifest.webmanifest" },
  { id: "robots", label: "robots.txt", path: "/robots.txt" },
  { id: "sitemap", label: "sitemap.xml", path: "/sitemap.xml" },
] as const;

const pwaGroup: LaunchCheckGroup = {
  id: "pwa",
  title: "PWA & SEO",
  items: PWA_ASSETS.map((a) => ({
    id: a.id,
    label: a.label,
    path: a.path,
    defaultState: "unknown",
  })),
};

const legalGroup: LaunchCheckGroup = {
  id: "legal",
  title: "Pages légales publiques",
  items: LEGAL_ROUTES.map((r) => ({
    id: `legal:${r}`,
    label: r,
    path: r,
    defaultState: "unknown",
  })),
};

const envGroup: LaunchCheckGroup = {
  id: "env",
  title: "Environnement (client)",
  items: [
    { id: "env:supabase-url", label: "VITE_SUPABASE_URL", defaultState: "unknown" },
    { id: "env:supabase-key", label: "VITE_SUPABASE_PUBLISHABLE_KEY", defaultState: "unknown" },
    { id: "env:project-id", label: "VITE_SUPABASE_PROJECT_ID", defaultState: "unknown" },
    { id: "env:backend-ready", label: "Backend prêt", defaultState: "unknown" },
  ],
};

const stripeGroup: LaunchCheckGroup = {
  id: "stripe",
  title: "Stripe / facturation",
  items: [
    {
      id: "stripe:secrets",
      label: "Configuration Stripe (clé secrète, webhook)",
      defaultState: "manual",
      detail: "Vérifier dans les secrets des fonctions edge.",
    },
    {
      id: "stripe:webhook",
      label: "Webhook stripe-webhook joignable",
      defaultState: "manual",
    },
  ],
};

const testsGroup: LaunchCheckGroup = {
  id: "tests",
  title: "Tests & build",
  items: [
    { id: "tests:vitest", label: "bunx vitest run", defaultState: "manual", detail: "Lancer localement / en CI." },
    { id: "tests:build", label: "bun run build", defaultState: "manual", detail: "Lancer localement / en CI." },
    { id: "tests:ci", label: "GitHub Actions CI vert", defaultState: "manual" },
  ],
};

export const LAUNCH_CHECK_GROUPS: LaunchCheckGroup[] = [
  pwaGroup,
  legalGroup,
  envGroup,
  stripeGroup,
  testsGroup,
];

export const getLaunchCheckGroup = (
  id: LaunchCheckGroupId,
): LaunchCheckGroup | undefined =>
  LAUNCH_CHECK_GROUPS.find((g) => g.id === id);

export const allLaunchCheckIds = (): string[] =>
  LAUNCH_CHECK_GROUPS.flatMap((g) => g.items.map((i) => i.id));

export interface EnvSnapshot {
  supabaseUrl?: string;
  supabaseKey?: string;
  projectId?: string;
}

/**
 * Compute env-group states from a snapshot. Pure; safe to unit-test.
 */
export const computeEnvStates = (
  env: EnvSnapshot,
): Record<string, LaunchCheckState> => {
  const url = !!env.supabaseUrl;
  const key = !!env.supabaseKey;
  const pid = !!env.projectId;
  return {
    "env:supabase-url": url ? "ok" : "fail",
    "env:supabase-key": key ? "ok" : "fail",
    "env:project-id": pid ? "ok" : "fail",
    "env:backend-ready": url && key ? "ok" : "fail",
  };
};
