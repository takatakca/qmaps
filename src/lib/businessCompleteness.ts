/**
 * Phase 15D — business profile completeness scoring (pure, testable).
 */

import { parseWeeklyHours } from "@/lib/businessHours";
import type { MenuItem } from "@/lib/menuItems";

export interface CompletenessBusiness {
  name?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  hours_json?: unknown;
  photos?: string[] | null;
  amenities?: string[] | null;
  payment_methods?: string[] | null;
  languages?: string[] | null;
  accessibility?: string[] | null;
}

export interface CompletenessResult {
  score: number; // 0..100
  completed: string[];
  missing: string[];
}

const has = (v: unknown): boolean =>
  typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : v != null;

export const getBusinessCompleteness = (
  business: CompletenessBusiness | null | undefined,
  menuItems: MenuItem[] = [],
): CompletenessResult => {
  const b = business ?? {};
  const week = parseWeeklyHours(b.hours_json);
  const checks: Array<[string, boolean]> = [
    ["name", has(b.name)],
    ["address", has(b.address) && has(b.city)],
    ["contact", has(b.phone) || has(b.website)],
    ["hours", !!week || has(b.hours)],
    ["photos", Array.isArray(b.photos) && b.photos.length > 0],
    ["menu", menuItems.length > 0],
    ["amenities", Array.isArray(b.amenities) && b.amenities.length > 0],
    ["payment_methods", Array.isArray(b.payment_methods) && b.payment_methods.length > 0],
    ["languages", Array.isArray(b.languages) && b.languages.length > 0],
    ["accessibility", Array.isArray(b.accessibility) && b.accessibility.length > 0],
  ];
  const completed = checks.filter(([, ok]) => ok).map(([k]) => k);
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  const score = Math.max(0, Math.min(100, Math.round((completed.length / checks.length) * 100)));
  return { score, completed, missing };
};

export const COMPLETENESS_LABELS_FR: Record<string, string> = {
  name: "Nom de l'entreprise",
  address: "Adresse complète",
  contact: "Téléphone ou site web",
  hours: "Heures d'ouverture",
  photos: "Photos",
  menu: "Menu",
  amenities: "Commodités",
  payment_methods: "Moyens de paiement",
  languages: "Langues parlées",
  accessibility: "Accessibilité",
};
