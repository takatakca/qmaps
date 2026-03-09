import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import { ChevronDown, Settings } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  business: Tables<"businesses">;
  displayName: string;
}

const HomeHeader = ({ business, displayName }: Props) => {
  const navigate = useNavigate();
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="bg-card border-b border-border px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-heading text-lg font-bold text-foreground">
          {greeting()}, {displayName}
        </h1>
        <button onClick={() => navigate("/merchant/more")} className="p-2 rounded-full hover:bg-accent">
          <Settings size={20} className="text-muted-foreground" />
        </button>
      </div>

      <button
        onClick={() => navigate("/merchant/marketplace")}
        className="w-full flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
      >
        <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0">
          {business.image_url ? (
            <img src={business.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">{business.name[0]}</div>
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-heading font-bold text-foreground text-sm truncate">{business.name}</p>
          <div className="flex items-center gap-1.5">
            <StarRating rating={business.avg_rating} size={12} />
            <span className="text-xs text-muted-foreground">({business.reviews_count} avis)</span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{business.address}, {business.city}</p>
        </div>
        <ChevronDown size={16} className="text-muted-foreground shrink-0" />
      </button>
    </div>
  );
};

export default HomeHeader;
