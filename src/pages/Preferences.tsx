import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Leaf, Wheat, Fish, Egg } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import BottomNav from "@/components/BottomNav";

const steps = [
  {
    title: "Avez-vous des préférences alimentaires?",
    subtitle: "Trouvez plus de restaurants avec des plats adaptés.",
    options: [
      { label: "Végétarien", icon: Leaf },
      { label: "Végan", icon: Leaf },
      { label: "Casher", icon: Egg },
      { label: "Keto", icon: Fish },
      { label: "Halal", icon: Wheat },
      { label: "Sans gluten", icon: Wheat },
      { label: "Pescatarien", icon: Fish },
    ],
  },
  {
    title: "Quels types de cuisine préférez-vous?",
    subtitle: "Recevez des recommandations personnalisées.",
    options: [
      { label: "Italienne", icon: Egg },
      { label: "Japonaise", icon: Fish },
      { label: "Mexicaine", icon: Wheat },
      { label: "Indienne", icon: Leaf },
      { label: "Thaïlandaise", icon: Fish },
      { label: "Française", icon: Egg },
    ],
  },
  {
    title: "Quels services recherchez-vous?",
    subtitle: "Personnalisez votre expérience QMAPS.",
    options: [
      { label: "Restaurants", icon: Egg },
      { label: "Cafés", icon: Leaf },
      { label: "Services à domicile", icon: Wheat },
      { label: "Auto & transport", icon: Fish },
      { label: "Beauté & bien-être", icon: Leaf },
    ],
  },
  {
    title: "Comment souhaitez-vous être notifié?",
    subtitle: "Choisissez vos préférences de notification.",
    options: [
      { label: "Nouveaux commerces", icon: Egg },
      { label: "Offres spéciales", icon: Leaf },
      { label: "Avis sur mes favoris", icon: Wheat },
      { label: "Événements locaux", icon: Fish },
    ],
  },
];

const Preferences = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});

  const current = steps[step];
  const selected = selections[step] || [];
  const totalSaved = Object.values(selections).flat().length;

  const toggle = (label: string) => {
    setSelections(prev => ({
      ...prev,
      [step]: selected.includes(label)
        ? selected.filter(s => s !== label)
        : [...selected, label],
    }));
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-sm font-semibold text-foreground">Ajouter des préférences</h1>
        <button onClick={() => navigate(-1)}><X size={22} className="text-foreground" /></button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="text-xs text-muted-foreground mb-1">{step + 1} sur {steps.length}</p>
        <h2 className="text-2xl font-bold text-foreground mb-2">{current.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{current.subtitle}</p>

        <div className="divide-y divide-border">
          {current.options.map(opt => (
            <button
              key={opt.label}
              onClick={() => toggle(opt.label)}
              className="w-full flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-3">
                <opt.icon size={24} className="text-foreground" />
                <span className="text-sm text-foreground">{opt.label}</span>
              </div>
              <Checkbox checked={selected.includes(opt.label)} />
            </button>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">✓ {totalSaved} sauvegardé{totalSaved !== 1 ? "s" : ""}</span>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} className="rounded-full px-6">
            Passer
          </Button>
        ) : (
          <Button onClick={() => navigate(-1)} className="rounded-full px-6">
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
};

export default Preferences;
