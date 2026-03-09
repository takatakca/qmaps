import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";

const sections = [
  {
    title: "Trouver des amis",
    description: "Permettez aux autres utilisateurs de trouver votre profil via votre nom ou email. Les amis ajoutés peuvent toujours vous trouver.",
    options: [
      { value: "yes", label: "Oui, m'inclure" },
      { value: "no", label: "Non, limiter ma visibilité" },
    ],
    default: "yes",
  },
  {
    title: "Favoris",
    description: "Permettre aux autres de voir mes favoris sur mon profil.",
    options: [
      { value: "yes", label: "Oui" },
      { value: "no", label: "Non" },
    ],
    default: "yes",
  },
  {
    title: "Messages directs des commerces",
    description: "Permettre aux propriétaires de commerces de vous envoyer des messages directs en réponse à votre avis (1 message max.)",
    options: [
      { value: "yes", label: "Oui, permettre le contact" },
      { value: "no", label: "Non, ne pas me contacter" },
    ],
    default: "yes",
  },
  {
    title: "Publicités affichées hors QMAPS",
    description: "Autoriser QMAPS à cibler des publicités sur d'autres sites et applications.",
    options: [
      { value: "yes", label: "Oui" },
      { value: "no", label: "Non" },
    ],
    default: "yes",
  },
];

const visibilityOptions = [
  { value: "name", label: "Mon nom et profil QMAPS", desc: "Prénom, initiale du nom, lien vers le profil, genre et tranche d'âge" },
  { value: "demo", label: "Mes données démographiques", desc: "Genre et tranche d'âge (20s, 30s, etc.)" },
  { value: "basic", label: "Informations de base", desc: "Aucun détail supplémentaire" },
];

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(sections.map((s, i) => [`section-${i}`, s.default]))
  );
  const [visibility, setVisibility] = useState("demo");

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <h1 className="font-heading text-lg font-bold">Paramètres de confidentialité</h1>
      </div>

      <div className="divide-y divide-border">
        {sections.map((section, i) => (
          <div key={i} className="px-4 py-5">
            <h3 className="text-sm font-bold text-foreground mb-1">{section.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{section.description}</p>
            <RadioGroup value={values[`section-${i}`]} onValueChange={v => setValues(prev => ({ ...prev, [`section-${i}`]: v }))} className="space-y-2">
              {section.options.map(opt => (
                <div key={opt.value} className="flex items-center justify-between py-1">
                  <Label htmlFor={`${i}-${opt.value}`} className="text-sm text-foreground cursor-pointer">{opt.label}</Label>
                  <RadioGroupItem value={opt.value} id={`${i}-${opt.value}`} />
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="px-4 py-5 border-t border-border">
        <h2 className="text-lg font-bold text-foreground mb-2">Visibilité pour les commerces</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Ces paramètres régissent la façon dont les commerces voient vos actions sur QMAPS, comme les appels, demandes d'itinéraire, vues de carte et visites sur leur site.
        </p>
        <h3 className="text-sm font-bold text-foreground mb-3">Ce que les commerces peuvent voir de moi</h3>
        <RadioGroup value={visibility} onValueChange={setVisibility} className="space-y-2">
          {visibilityOptions.map(opt => (
            <div key={opt.value} className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor={`vis-${opt.value}`} className="text-sm text-foreground cursor-pointer block">{opt.label}</Label>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <RadioGroupItem value={opt.value} id={`vis-${opt.value}`} />
            </div>
          ))}
        </RadioGroup>
      </div>

      <BottomNav />
    </div>
  );
};

export default PrivacySettings;
