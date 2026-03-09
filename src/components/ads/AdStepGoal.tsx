import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { AdFormData } from "@/pages/MerchantAds";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
}

const goals = [
  {
    key: "optimize" as const,
    title: "Laisser QMAPS optimiser",
    sub: "(Recommandé)",
    bullets: ["Vous voulez atteindre plus de clients", "Vous voulez diriger les gens vers votre page QMAPS"],
  },
  {
    key: "calls" as const,
    title: "Recevoir plus d'appels",
    bullets: ["Vous voulez connecter directement avec des clients potentiels"],
    hasToggle: true,
    toggleLabel: "Pour suivre les appels, nous créerons un numéro de renvoi personnalisé qui remplacera celui de votre fiche.",
  },
  {
    key: "clicks" as const,
    title: "Obtenir plus de clics web",
    bullets: ["Vous faites la majorité de vos affaires en ligne", "Vous voulez diriger les gens vers votre formulaire, menu, etc."],
    hasUrl: true,
  },
];

const AdStepGoal = ({ formData, update }: Props) => (
  <div className="space-y-3">
    <h2 className="font-heading text-lg font-bold text-foreground">Choisissez un objectif pour votre publicité</h2>
    {goals.map(g => {
      const selected = formData.goal === g.key;
      return (
        <button
          key={g.key}
          onClick={() => update({ goal: g.key })}
          className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${
            selected ? "border-primary bg-card" : "border-border bg-card"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selected ? "border-primary bg-primary" : "border-muted-foreground"
            }`}>
              {selected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{g.title}</p>
              {g.sub && <p className="text-xs text-muted-foreground">{g.sub}</p>}
              {selected && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Choisissez cet objectif si :</p>
                  {g.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-success mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{b}</span>
                    </div>
                  ))}
                  {g.hasToggle && (
                    <div className="mt-3 bg-muted rounded-lg p-3 flex items-start gap-3">
                      <p className="text-xs text-muted-foreground flex-1">{g.toggleLabel}</p>
                      <Switch checked={formData.callForwarding} onCheckedChange={v => update({ callForwarding: v })} />
                    </div>
                  )}
                  {g.hasUrl && selected && (
                    <div className="mt-3">
                      <label className="text-xs text-muted-foreground">URL de votre site web</label>
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={e => update({ websiteUrl: e.target.value })}
                        placeholder="https://www.example.com"
                        className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

export default AdStepGoal;
