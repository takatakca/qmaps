import { useState } from "react";
import { ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import type { AdFormData } from "@/pages/MerchantAds";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
}

const ALL_KEYWORDS = [
  "Bagels", "Boulangerie", "Beignets", "Boba", "Brunch",
  "Bubble Tea", "Café", "Cafés & Coffee Shops", "Cannoli",
  "Croissant", "Desserts", "Donuts", "Espresso", "Gluten Free",
  "Hot & New", "Crème glacée", "Latte", "Pâtisserie",
  "Pizza", "Poulet", "Ramen", "Sushi", "Tacos", "Vegan",
  "Végétarien", "Burger", "Sandwich", "Fruits de mer",
];

const AdStepKeywords = ({ formData, update }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? ALL_KEYWORDS : ALL_KEYWORDS.slice(0, 6);

  const toggle = (kw: string) => {
    const boosted = formData.boostedKeywords.includes(kw)
      ? formData.boostedKeywords.filter(k => k !== kw)
      : [...formData.boostedKeywords, kw];
    update({ boostedKeywords: boosted });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-bold text-foreground mb-1">Vos mots-clés</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choisissez des mots-clés importants à booster. QMAPS affichera vos publicités avec les mots-clés boostés plus souvent.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap gap-2">
          {visible.map(kw => {
            const boosted = formData.boostedKeywords.includes(kw);
            return (
              <button
                key={kw}
                onClick={() => toggle(kw)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  boosted ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-foreground"
                }`}
              >
                {kw}
                {boosted && <ArrowUp size={12} />}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowAll(!showAll)} className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
          {showAll ? "Voir moins" : "Voir plus"} {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">Vous pouvez aussi bloquer des mots-clés après l'achat.</p>
    </div>
  );
};

export default AdStepKeywords;
