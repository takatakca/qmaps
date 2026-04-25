/**
 * Phase 9D — Recommendation event tracker.
 *
 * Fire-and-forget. Never throws. Never blocks UI. Supports anonymous users
 * via a session id stored in localStorage.
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

export interface RecommendationEventInput {
  business_id: string;
  event_type: RecommendationEventType;
  category_id?: string | null;
  city?: string | null;
  source?: string | null;
  weight?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget tracker. Never throws.
 */
export const trackRecommendationEvent = (input: RecommendationEventInput): void => {
  if (!input?.business_id || !input?.event_type) return;
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
