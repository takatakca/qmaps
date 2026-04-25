/**
 * Phase 9D — Review trust hook.
 *
 * Provides:
 *  - computeLocalReviewSignals(input) — pure rules result, no DB writes.
 *  - submitReviewForScoring(review_id) — fire-and-forget edge function call.
 *  - getReviewTrustScore(review_id) — read trust score (RLS-restricted).
 */
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  computeLocalReviewSignals,
  computeRiskFromSignals,
  type LocalReviewInput,
  type RiskScoreResult,
} from "@/lib/reviewTrust";

export const useReviewTrust = () => {
  const computeLocal = useCallback((input: LocalReviewInput): RiskScoreResult => {
    return computeRiskFromSignals(computeLocalReviewSignals(input));
  }, []);

  const submitReviewForScoring = useCallback(async (reviewId: string): Promise<void> => {
    if (!reviewId) return;
    try {
      await supabase.functions.invoke("analyze-review-risk", {
        body: { review_id: reviewId },
      });
    } catch {
      // never block on scoring
    }
  }, []);

  const getReviewTrustScore = useCallback(async (reviewId: string) => {
    if (!reviewId) return null;
    try {
      const { data } = await supabase
        .from("review_trust_scores" as any)
        .select("*")
        .eq("review_id", reviewId)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  }, []);

  return { computeLocal, submitReviewForScoring, getReviewTrustScore };
};
