/**
 * Phase 9F — Reusable "Recommended for you" section.
 *
 * Renders a list of business cards plus a small explainable reason chip, and
 * tracks impressions/clicks/dismissals through useRecommendationEvents.
 *
 * Additive: does not replace any existing list component.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import BusinessCard from "@/components/BusinessCard";
import { mapBusinessToCard } from "@/lib/business";
import { formatRecommendationReasons, type RecommendationReasonCode } from "@/lib/recommendations";
import { trackRecommendationEvent } from "@/hooks/useRecommendationEvents";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export interface RecommendationItem {
  business: Tables<"businesses"> & { category_ids?: string[] };
  reasonCodes?: RecommendationReasonCode[];
}

interface Props {
  title: string;
  subtitle?: string;
  source: string; // e.g. "home_for_you", "city_trending"
  items: RecommendationItem[];
  showReasonChips?: boolean;
  emptyHint?: string;
  loading?: boolean;
  /** Friendly explanation shown under the title. Phase 9D. */
  helperText?: string;
}

const DEFAULT_HELPER_TEXT =
  "Les recommandations s'améliorent à mesure que vous consultez, sauvegardez et notez des commerces.";

const RecommendedSection = ({
  title,
  subtitle,
  source,
  items,
  showReasonChips = true,
  emptyHint,
  loading,
  helperText = DEFAULT_HELPER_TEXT,
}: Props) => {
  const { user } = useAuth();
  const seen = useRef<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Fire impressions exactly once per (item, source) per render lifecycle
  useEffect(() => {
    for (const it of items) {
      const key = `${source}:${it.business.id}`;
      if (seen.current.has(key)) continue;
      seen.current.add(key);
      trackRecommendationEvent({
        business_id: it.business.id,
        event_type: "recommendation_impression",
        source,
        category_id: (it.business.category_ids ?? [])[0] ?? null,
        city: it.business.city ?? null,
        weight: 0.05,
        metadata: { reasons: it.reasonCodes ?? [] },
      });
    }
  }, [items, source]);

  const visible = items.filter((it) => !dismissed.has(it.business.id));

  if (loading) {
    return (
      <section className="space-y-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <p className="text-xs text-muted-foreground py-4">Chargement…</p>
      </section>
    );
  }

  if (visible.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="space-y-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <p className="text-xs text-muted-foreground py-2">{emptyHint}</p>
      </section>
    );
  }

  const handleClick = (it: RecommendationItem) => {
    trackRecommendationEvent({
      business_id: it.business.id,
      event_type: "recommendation_click",
      source,
      category_id: (it.business.category_ids ?? [])[0] ?? null,
      city: it.business.city ?? null,
      weight: 1.2,
      metadata: { reasons: it.reasonCodes ?? [] },
    });
    void supabase.from("recommendation_feedback" as any).insert({
      user_id: user?.id ?? null,
      business_id: it.business.id,
      recommendation_source: source,
      feedback_type: "clicked",
      metadata: { reasons: it.reasonCodes ?? [] },
    } as any);
  };

  const handleDismiss = (it: RecommendationItem) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(it.business.id);
      return next;
    });
    trackRecommendationEvent({
      business_id: it.business.id,
      event_type: "recommendation_dismiss",
      source,
      weight: -1.5,
    });
    void supabase.from("recommendation_feedback" as any).insert({
      user_id: user?.id ?? null,
      business_id: it.business.id,
      recommendation_source: source,
      feedback_type: "dismissed",
    } as any);
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {helperText && (
          <p className="text-[11px] text-muted-foreground/80 mt-1">{helperText}</p>
        )}
      </div>
      <div className="space-y-3">
        {visible.map((it) => (
          <div key={it.business.id} className="relative">
            <Link to={`/business/${it.business.id}`} onClick={() => handleClick(it)} className="block">
              <BusinessCard business={mapBusinessToCard(it.business)} />
            </Link>
            <div className="flex items-center justify-between mt-1 px-1">
              {showReasonChips ? (
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                  {formatRecommendationReasons(it.reasonCodes ?? [])}
                </span>
              ) : <span />}
              <button
                type="button"
                onClick={() => handleDismiss(it)}
                aria-label="Pas intéressé"
                title="Pas intéressé"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground p-1"
              >
                <X size={12} />
                <span>Pas intéressé</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedSection;
