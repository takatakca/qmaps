import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface BusinessNearbySectionProps {
  currentBusinessId: string;
  city: string;
  isClaimed: boolean;
}

const priceLabels = ["$", "$$", "$$$", "$$$$"];

const BusinessNearbySection = ({ currentBusinessId, city, isClaimed }: BusinessNearbySectionProps) => {
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<Tables<"businesses">[]>([]);

  useEffect(() => {
    const fetchNearby = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("city", city)
        .neq("id", currentBusinessId)
        .order("avg_rating", { ascending: false })
        .limit(4);
      setNearby(data || []);
    };
    fetchNearby();
  }, [currentBusinessId, city]);

  return (
    <>
      {/* People also viewed */}
      {nearby.length > 0 && (
        <div className="px-4 py-5 border-t border-border">
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">Les gens ont aussi consulté</h3>
          <div className="space-y-0">
            {nearby.map((biz, i) => (
              <div key={biz.id}>
                <div
                  onClick={() => navigate(`/business/${biz.id}`)}
                  className="flex items-start gap-3 cursor-pointer py-3"
                >
                  {/* Thumbnail */}
                  <img
                    src={biz.image_url || "/placeholder.svg"}
                    alt={biz.name}
                    className="w-20 h-16 rounded-lg object-cover shrink-0"
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{biz.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRating rating={Number(biz.avg_rating)} size={11} />
                      <span className="text-xs text-muted-foreground">
                        {Number(biz.avg_rating).toFixed(1)} ({biz.reviews_count} avis)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{biz.address}</p>
                  </div>
                  {/* Distance + price */}
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-muted-foreground">
                      {(Math.random() * 10 + 1).toFixed(1)} km
                    </span>
                    {biz.price_level && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {priceLabels[(biz.price_level || 1) - 1]}
                      </p>
                    )}
                  </div>
                </div>
                {i < nearby.length - 1 && <div className="border-b border-border" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim business CTA */}
      {!isClaimed && (
        <div className="px-4 py-6 bg-secondary/30 border-t border-border">
          <h3 className="font-heading text-xl font-bold text-foreground mb-2">
            Vous travaillez dans ce commerce?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Revendiquez votre page pour répondre aux avis et messages de vos clients.
          </p>
          <Button
            className="w-full rounded-full font-semibold"
            onClick={() => navigate("/merchant")}
          >
            Revendiquer ce commerce
          </Button>
        </div>
      )}
    </>
  );
};

export default BusinessNearbySection;
