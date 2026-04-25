/**
 * Phase 9D/9E — Recommendation event tracker.
 *
 * Fire-and-forget. Never throws. Never blocks UI. Supports anonymous users
 * via a session id stored in localStorage.
 *
 * Phase 9E adds optional client-side dedupe: when `dedupeKey` is provided,
 * the event is only sent once per browser session for that key. This avoids
 * spamming `business_view`, `city_view`, and `category_view` on remounts /
 * re-renders. Action-style events (`search_click`, `recommendation_click`,
 * `bookmark_*`) intentionally do NOT use dedupe.
 */
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RecommendationEventType } from "@/lib/recommendations";

const SESSION_STORAGE_KEY = "qmaps:rec:session_id";

const getSessionId = (): string => {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
};

// In-memory dedupe set, scoped to the current page session.
const dedupeSeen: Set<string> = new Set();

/**
 * Build a stable dedupe key for an event. Pure helper, exported for tests.
 *
 * - business_view: `view:<business_id>`
 * - city_view: `city:<normalized_city>`
 * - category_view: `cat:<category_id>:<normalized_city>`
 * - default: `<event_type>:<business_id>`
 *
 * Returns null when an event type should NOT be deduped client-side.
 */
export const buildRecommendationDedupeKey = (
  input: Pick<RecommendationEventInput, "event_type" | "business_id" | "category_id" | "city">
): string | null => {
  const cityKey = (input.city ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  switch (input.event_type) {
    case "business_view":
      return `view:${input.business_id}`;
    case "city_view":
      return cityKey ? `city:${cityKey}` : null;
    case "category_view":
      return input.category_id ? `cat:${input.category_id}:${cityKey}` : null;
    // Action-style events: do not dedupe.
    case "search_click":
    case "recommendation_click":
    case "recommendation_dismiss":
    case "bookmark_add":
    case "bookmark_remove":
    case "review_create":
    case "directions_click":
    case "phone_click":
    case "website_click":
      return null;
    default:
      return null;
  }
};

/**
 * Test-only helper to clear the in-memory dedupe set between test cases.
 */
export const __resetRecommendationDedupeForTests = (): void => {
  dedupeSeen.clear();
};

export interface RecommendationEventInput {
  business_id: string;
  event_type: RecommendationEventType;
  category_id?: string | null;
  city?: string | null;
  source?: string | null;
  weight?: number;
  metadata?: Record<string, unknown>;
  /**
   * Optional explicit dedupe key. If omitted, the helper will derive one
   * automatically for view-style events via buildRecommendationDedupeKey.
   * Pass `dedupe: false` to force-send even when a derived key exists.
   */
  dedupeKey?: string | null;
  dedupe?: boolean;
}

/**
 * Fire-and-forget tracker. Never throws.
 */
export const trackRecommendationEvent = (input: RecommendationEventInput): void => {
  if (!input?.business_id || !input?.event_type) return;

  // Phase 9E — client-side dedupe
  if (input.dedupe !== false) {
    const key =
      input.dedupeKey !== undefined && input.dedupeKey !== null
        ? input.dedupeKey
        : buildRecommendationDedupeKey(input);
    if (key) {
      if (dedupeSeen.has(key)) return;
      dedupeSeen.add(key);
    }
  }

  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        user_id: user?.id ?? null,
        session_id: user?.id ? null : getSessionId(),
        business_id: input.business_id,
        category_id: input.category_id ?? null,
        city: input.city ?? null,
        event_type: input.event_type,
        source: input.source ?? null,
        weight: typeof input.weight === "number" ? input.weight : 1,
        metadata: input.metadata ?? {},
      };
      await supabase.from("recommendation_events" as any).insert(payload as any);
    } catch {
      // silent
    }
  })();
};

export const useRecommendationEvents = () => {
  const track = useCallback((input: RecommendationEventInput) => {
    trackRecommendationEvent(input);
  }, []);
  return { track };
};
