import { ArrowLeft, MapPin } from "lucide-react";
import StarRating from "@/components/StarRating";
import type { Tables } from "@/integrations/supabase/types";
import type { AdFormData } from "@/pages/MerchantAds";

interface Props {
  business: Tables<"businesses">;
  formData: AdFormData;
}

const AdPreviewCard = ({ business, formData }: Props) => (
  <div className="space-y-0">
    {/* Map area */}
    <div className="bg-muted rounded-t-xl h-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/60 to-muted" />
      <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
        <ArrowLeft size={16} className="text-foreground" />
        <span className="text-sm text-muted-foreground flex-1">Recherche de votre client</span>
        <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center">
          <MapPin size={14} className="text-foreground" />
        </div>
      </div>
    </div>

    {/* Sponsored Results */}
    <div className="bg-card border-x border-border px-3 pt-3 pb-1">
      <p className="text-xs font-semibold text-muted-foreground italic">Résultats sponsorisés</p>
    </div>

    {/* Ad preview badge + business card */}
    <div className="bg-card border border-primary/40 rounded-b-xl overflow-hidden">
      <div className="px-3 pt-2">
        <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
          Aperçu de votre pub sur QMAPS
        </span>
      </div>
      <div className="flex gap-3 p-3">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
          <img
            src={formData.photoUrl || business.image_url || "/placeholder.svg"}
            alt=""
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0.5 left-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded">
            Exemple
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-bold text-foreground truncate">{business.name}</p>
            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">0 km</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{business.address}</p>
        </div>
      </div>
      <div className="px-3 pb-3">
        <p className="text-xs text-muted-foreground line-clamp-1">{formData.adText || business.description}</p>
      </div>

      {/* All Results / Competitor */}
      <div className="border-t border-border px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground italic mb-2">Tous les résultats</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Concurrent potentiel</span>
            <StarRating rating={0} size={10} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AdPreviewCard;
