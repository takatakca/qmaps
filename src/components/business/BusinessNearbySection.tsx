import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface BusinessNearbySectionProps {
  currentBusinessId: string;
  city: string;
}

const BusinessNearbySection = ({ currentBusinessId, city }: BusinessNearbySectionProps) => {
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
        .limit(3);
      setNearby(data || []);
    };
    fetchNearby();
  }, [currentBusinessId, city]);

  if (nearby.length === 0) return null;

  return (
    <div className="px-4 py-5 bg-secondary/30 border-t border-border">
      <h3 className="font-heading text-lg font-bold text-foreground mb-1">Commerces à proximité</h3>
      <p className="text-xs text-muted-foreground mb-4">Suggestions</p>
      <div className="space-y-4">
        {nearby.map((biz) => (
          <div
            key={biz.id}
            onClick={() => navigate(`/business/${biz.id}`)}
            className="cursor-pointer"
          >
            <p className="text-sm font-bold text-foreground">{biz.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={Number(biz.avg_rating)} size={12} />
              <span className="text-xs text-muted-foreground">({biz.reviews_count} avis)</span>
            </div>
            {biz.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {biz.description}
              </p>
            )}
            {biz !== nearby[nearby.length - 1] && <div className="border-b border-border mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessNearbySection;
