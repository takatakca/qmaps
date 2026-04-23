import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ReactionType = "useful" | "funny" | "cool";

interface ReviewReactionState {
  counts: Record<ReactionType, number>;
  mine: Record<ReactionType, boolean>;
}

const emptyState = (): ReviewReactionState => ({
  counts: { useful: 0, funny: 0, cool: 0 },
  mine: { useful: false, funny: false, cool: false },
});

export const useReviewReactions = (reviewIds: string[]) => {
  const { user } = useAuth();
  const [state, setState] = useState<Record<string, ReviewReactionState>>({});
  const [pending, setPending] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!reviewIds.length) {
      setState({});
      return;
    }

    const { data } = await supabase
      .from("review_reactions" as any)
      .select("review_id, user_id, reaction_type")
      .in("review_id", reviewIds);

    const next: Record<string, ReviewReactionState> = {};
    for (const id of reviewIds) next[id] = emptyState();

    for (const row of (data || []) as any[]) {
      const target = next[row.review_id] || emptyState();
      if (row.reaction_type in target.counts) {
        target.counts[row.reaction_type as ReactionType] += 1;
        if (user && row.user_id === user.id) target.mine[row.reaction_type as ReactionType] = true;
      }
      next[row.review_id] = target;
    }

    setState(next);
  }, [reviewIds, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleReaction = useCallback(async (reviewId: string, reactionType: ReactionType) => {
    if (!user) throw new Error("not-authenticated");
    setPending(`${reviewId}:${reactionType}`);

    const current = state[reviewId] || emptyState();
    const hasReaction = current.mine[reactionType];

    setState((prev) => {
      const reviewState = prev[reviewId] || emptyState();
      const delta = hasReaction ? -1 : 1;
      return {
        ...prev,
        [reviewId]: {
          counts: {
            ...reviewState.counts,
            [reactionType]: Math.max(0, reviewState.counts[reactionType] + delta),
          },
          mine: {
            ...reviewState.mine,
            [reactionType]: !hasReaction,
          },
        },
      };
    });

    const query = supabase.from("review_reactions" as any);
    const { error } = hasReaction
      ? await query.delete().eq("review_id", reviewId).eq("user_id", user.id).eq("reaction_type", reactionType)
      : await query.insert({ review_id: reviewId, user_id: user.id, reaction_type: reactionType });

    if (error) {
      await refresh();
      setPending(null);
      throw error;
    }

    setPending(null);
    window.dispatchEvent(new CustomEvent("qmaps:review-reactions-updated"));
  }, [refresh, state, user]);

  const byReview = useMemo(() => state, [state]);

  return { byReview, pending, toggleReaction, refresh };
};
