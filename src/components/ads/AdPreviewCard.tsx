import StarRating from "@/components/StarRating";
import type { Tables } from "@/integrations/supabase/types";
import type { AdFormData } from "@/pages/MerchantAds";

interface Props {
  business: Tables<"businesses">;
  formData: AdFormData;
}

const AdPreviewCard = ({ business, formData }: Props) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="flex gap-3 p-3">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
        <img src={formData.photoUrl || business.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">Exemple</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-sm font-bold text-foreground truncate">{business.name}</p>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">0 km</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{business.address}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{formData.adText || business.description}</p>
      </div>
    </div>
    <div className="border-t border-border px-3 py-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Concurrent potentiel</span>
        <StarRating rating={0} size={10} />
      </div>
    </div>
  </div>
);

export default AdPreviewCard;
