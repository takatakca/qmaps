import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { AdFormData } from "@/pages/MerchantAds";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
  business: Tables<"businesses">;
}

const AdStepPhoto = ({ formData, update, business }: Props) => (
  <div className="space-y-4">
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-heading font-bold text-foreground mb-1">Votre galerie photo</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Optimisez votre publicité avec la sélection intelligente ou choisissez votre propre photo en désactivant la sélection intelligente.
      </p>
      <div className="flex gap-3 flex-wrap">
        <button className="w-28 h-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
          <Plus size={24} className="text-muted-foreground" />
        </button>
        {business.image_url && (
          <img
            src={business.image_url}
            alt="Business"
            className={`w-28 h-28 rounded-lg object-cover border-2 ${formData.photoUrl === business.image_url ? "border-primary" : "border-transparent"}`}
            onClick={() => update({ photoUrl: business.image_url! })}
          />
        )}
        {business.photos?.filter(p => p !== business.image_url).map((p, i) => (
          <img
            key={i}
            src={p}
            alt=""
            className={`w-28 h-28 rounded-lg object-cover border-2 cursor-pointer ${formData.photoUrl === p ? "border-primary" : "border-transparent"}`}
            onClick={() => update({ photoUrl: p })}
          />
        ))}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Sélection intelligente</p>
          <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
            Choisi par 79% des entreprises
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Nous testerons continuellement les photos de votre galerie et utiliserons celle qui génère le plus de clics.
          </p>
        </div>
        <Switch checked={formData.smartPhotoSelection} onCheckedChange={v => update({ smartPhotoSelection: v })} />
      </div>
    </div>
  </div>
);

export default AdStepPhoto;
