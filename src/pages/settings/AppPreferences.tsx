import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const categories = [
  { key: "essential", label: "Essentiel", required: true },
  { key: "analytics", label: "Analytique", required: false },
  { key: "functional", label: "Fonctionnel", required: false },
  { key: "targeting", label: "Ciblage", required: false },
];

const AppPreferences = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    essential: true,
    analytics: false,
    functional: false,
    targeting: false,
  });

  const allowAll = () => setPrefs({ essential: true, analytics: true, functional: true, targeting: true });
  const essentialOnly = () => setPrefs({ essential: true, analytics: false, functional: false, targeting: false });

  const save = () => {
    toast({ title: "Préférences sauvegardées" });
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Préférences de l'app</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          L'application peut stocker ou récupérer des informations sur votre appareil, généralement sous forme de kits de développement logiciel (SDKs). Ces informations peuvent concerner vous, vos préférences ou votre appareil et sont principalement utilisées pour que l'application fonctionne comme vous l'attendez. Vous pouvez choisir de ne pas autoriser certains types de SDKs. Cliquez sur les différentes catégories ci-dessous pour en savoir plus et modifier ces paramètres.
        </p>
        <button className="text-primary text-sm font-medium mt-2">Plus d'informations</button>
      </div>

      <div className="flex gap-3 px-4 pb-4">
        <Button onClick={allowAll} className="flex-1 rounded-full">Tout autoriser</Button>
        <Button onClick={essentialOnly} variant="outline" className="flex-1 rounded-full">Essentiel uniquement</Button>
      </div>

      <div className="divide-y divide-border">
        {categories.map(cat => (
          <div key={cat.key} className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium text-foreground">{cat.label}</span>
            <div className="flex items-center gap-2">
              {cat.required ? (
                <span className="text-xs text-primary font-medium">Requis</span>
              ) : (
                <Switch
                  checked={prefs[cat.key]}
                  onCheckedChange={v => setPrefs(p => ({ ...p, [cat.key]: v }))}
                />
              )}
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4">
        <Button onClick={save} className="w-full rounded-full">Sauvegarder les préférences</Button>
      </div>
    </div>
  );
};

export default AppPreferences;
