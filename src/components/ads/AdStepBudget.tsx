import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { AdFormData } from "@/pages/MerchantAds";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
}

const PRESETS = [16, 24, 40];

const AdStepBudget = ({ formData, update }: Props) => {
  const [custom, setCustom] = useState(false);
  const daily = custom && formData.customBudget ? formData.customBudget : formData.budgetPreset;
  const monthly = daily * 30;
  const estClicks = Math.round(daily * 38.5);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-foreground">Choisissez un budget</h2>
      <p className="text-sm text-muted-foreground">Choisissez un budget adapté à vos objectifs.</p>

      <div className="text-center">
        <p className="text-3xl font-bold text-foreground">{daily},00 CA$ <span className="text-base font-normal text-muted-foreground">/jour moy</span></p>
        <p className="text-sm text-primary font-medium">{monthly} CA$ /mois max</p>
        <span className="inline-block bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full mt-1">Populaire pour votre secteur</span>
      </div>

      <div className="flex gap-2">
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => { setCustom(false); update({ budgetPreset: p, customBudget: null }); }}
            className={`flex-1 py-2 rounded-full text-sm font-medium border transition-colors ${
              !custom && formData.budgetPreset === p ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
            }`}
          >
            {p} CA$
          </button>
        ))}
        <button
          onClick={() => setCustom(true)}
          className={`flex-1 py-2 rounded-full text-sm font-medium border transition-colors ${
            custom ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
          }`}
        >
          Personnalisé
        </button>
      </div>

      {custom && (
        <input
          type="number"
          min={5}
          placeholder="Montant par jour"
          value={formData.customBudget || ""}
          onChange={e => update({ customBudget: Number(e.target.value) || null })}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      )}

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground">Résultats mensuels estimés</p>
        <p className="text-2xl font-bold text-primary">+{estClicks} <span className="text-sm font-normal text-muted-foreground">clics</span></p>
        <p className="text-xs text-muted-foreground mt-1">Estimation basée sur des entreprises similaires. Les résultats réels peuvent varier.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-foreground mb-1">Améliorez vos résultats</h4>
        <p className="text-xs text-muted-foreground mb-3">Passez au niveau supérieur avec des outils supplémentaires pour améliorer votre page et votre visibilité sur QMAPS.</p>
        <div className={`rounded-xl border-2 p-3 ${formData.upgradePackage ? "border-primary" : "border-border"}`}>
          <div className="flex items-start gap-2">
            <Checkbox checked={formData.upgradePackage} onCheckedChange={v => update({ upgradePackage: !!v })} className="mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Package Upgrade</p>
              <p className="text-xs text-muted-foreground line-through">16$/jour</p>
              <p className="text-sm text-primary font-bold">4 CA$/jour (moy) avec achat publicitaire</p>
              <p className="text-xs text-muted-foreground mt-1">
                Inclut: suppression des pubs concurrentes, call-to-action, mise en avant, logo, diaporama et QMAPS Connect.
              </p>
              <button className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
                En savoir plus <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdStepBudget;
