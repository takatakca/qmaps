/**
 * Phase 9F — Similar businesses on BusinessDetail.
 *
 * Wraps useSimilarBusinesses into the shared RecommendedSection so impressions,
 * clicks and dismissals are tracked consistently with other Phase 9F surfaces.
 */
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useSimilarBusinesses } from "@/hooks/useSimilarBusinesses";
import type { RecommendationReasonCode } from "@/lib/recommendations";

interface Props {
  businessId: string;
  limit?: number;
}

const SimilarBusinessesSection = ({ businessId, limit = 4 }: Props) => {
  const { items, loading } = useSimilarBusinesses(businessId, { limit });
  const mapped = items.map((it) => {
    const reason: RecommendationReasonCode =
      it.reason === "Même ville" ? "matches_top_city" : "matches_top_category";
    return { business: it.business as any, reasonCodes: [reason] };
  });
  return (
    <div className="px-4 py-5 border-t border-border">
      <RecommendedSection
        title="Commerces similaires"
        subtitle="Basé sur la catégorie et la localisation"
        source="business_similar"
        items={mapped}
        loading={loading}
      />
    </div>
  );
};

export default SimilarBusinessesSection;
