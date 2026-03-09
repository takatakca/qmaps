import { Switch } from "@/components/ui/switch";
import type { AdFormData } from "@/pages/MerchantAds";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
}

const MAX_CHARS = 1500;

const AdStepText = ({ formData, update }: Props) => (
  <div className="space-y-4">
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="font-heading font-bold text-foreground mb-3">Écrivez votre texte publicitaire</h3>
      <div className="relative">
        <textarea
          value={formData.adText}
          onChange={e => update({ adText: e.target.value.slice(0, MAX_CHARS) })}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">{MAX_CHARS - formData.adText.length}</span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Sélection intelligente</p>
          <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
            Choisi par 67% des entreprises
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Lorsque votre entreprise aura des avis positifs, nous les testerons et utiliserons celui qui génère le plus de clics.
          </p>
        </div>
        <Switch checked={formData.smartTextSelection} onCheckedChange={v => update({ smartTextSelection: v })} />
      </div>
    </div>
  </div>
);

export default AdStepText;
