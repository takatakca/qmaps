import { MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { AdFormData } from "@/pages/MerchantAds";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
  business: Tables<"businesses">;
}

const AdStepLocation = ({ formData, update, business }: Props) => (
  <div className="space-y-4">
    <h3 className="font-heading font-bold text-foreground mb-1">Définissez votre zone de ciblage</h3>
    <p className="text-sm text-muted-foreground">
      Choisissez le rayon autour de votre entreprise dans lequel votre publicité sera affichée.
    </p>

    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{business.name}</p>
          <p className="text-xs text-muted-foreground">{business.address}</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl h-40 flex items-center justify-center mb-4">
        <p className="text-xs text-muted-foreground">Carte — rayon de {formData.locationRadius} km</p>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-foreground font-medium">Rayon de ciblage</span>
          <span className="text-sm font-bold text-primary">{formData.locationRadius} km</span>
        </div>
        <Slider
          value={[formData.locationRadius]}
          onValueChange={([v]) => update({ locationRadius: v })}
          min={5}
          max={100}
          step={5}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">5 km</span>
          <span className="text-[10px] text-muted-foreground">100 km</span>
        </div>
      </div>
    </div>
  </div>
);

export default AdStepLocation;
