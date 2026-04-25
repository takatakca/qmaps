import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useApprovedSponsoredListings,
} from "@/hooks/useSponsoredCampaigns";
import { trackSponsoredEvent, type SponsoredPlacement } from "@/lib/sponsored";
import StarRating from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface Props {
  placement: SponsoredPlacement;
  city?: string | null;
  categoryId?: string | null;
  limit?: number;
  title?: string;
}

const SponsoredListings = ({
  placement,
  city,
  categoryId,
  limit = 3,
  title = "Sponsorisé",
}: Props) => {
  const navigate = useNavigate();
  const { listings, loading } = useApprovedSponsoredListings({
    placement,
    city,
    categoryId,
    limit,
  });
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    listings.forEach((l) => {
      if (!trackedRef.current.has(l.id) && l.business) {
        trackedRef.current.add(l.id);
        trackSponsoredEvent(l.id, l.business.id, "impression", placement);
      }
    });
  }, [listings, placement]);

  if (loading || listings.length === 0) return null;

  const handleClick = (campaignId: string, businessId: string) => {
    trackSponsoredEvent(campaignId, businessId, "click", placement);
    navigate(`/business/${businessId}`);
  };

  return (
    <section aria-label="Listings sponsorisés" className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-primary" />
        <h2 className="font-heading text-sm font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-2">
        {listings.map((l) =>
          l.business ? (
            <button
              key={l.id}
              onClick={() => handleClick(l.id, l.business!.id)}
              className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/30 transition-colors text-left"
            >
              <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                {l.business.image_url ? (
                  <img
                    src={l.business.image_url}
                    alt={l.business.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                    {l.business.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-bold text-foreground text-sm truncate">
                    {l.business.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 shrink-0"
                  >
                    Sponsorisé
                  </Badge>
                </div>
                {l.headline && (
                  <p className="text-xs text-foreground/80 truncate mt-0.5">
                    {l.headline}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <StarRating rating={l.business.avg_rating} size={11} />
                  <span className="text-[11px] text-muted-foreground">
                    {l.business.avg_rating.toFixed(1)} ({l.business.reviews_count})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {l.business.address}, {l.business.city}
                </p>
              </div>
            </button>
          ) : null,
        )}
      </div>
    </section>
  );
};

export default SponsoredListings;
