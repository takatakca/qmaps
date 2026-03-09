import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import { Megaphone } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  business: Tables<"businesses">;
}

const AdPreviewSection = ({ business }: Props) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="bg-muted/50 px-3 py-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Aperçu de votre annonce</span>
        </div>
        <div className="p-3 flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
            {business.image_url ? (
              <img src={business.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-lg text-muted-foreground">{business.name[0]}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-foreground text-sm">{business.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarRating rating={business.avg_rating} size={12} />
              <span className="text-xs text-muted-foreground">{business.avg_rating.toFixed(1)} · {business.reviews_count} avis</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{business.address}, {business.city}</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2 flex items-start gap-3">
        <Megaphone size={20} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground">
            Des gens recherchent des entreprises comme la vôtre dans votre secteur.
          </p>
          <button onClick={() => navigate("/merchant/optimization")} className="text-xs text-primary font-semibold mt-1">
            Attirer plus de clients →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdPreviewSection;
