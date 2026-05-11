import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

export const PAYMENT_METHODS = [
  "Espèces",
  "Débit",
  "Carte de crédit",
  "Apple Pay",
  "Google Pay",
  "Interac",
  "Paiement en ligne",
];

export const LANGUAGES = ["Français", "Anglais", "Espagnol", "Arabe", "Autre"];

export const ACCESSIBILITY = [
  "Entrée accessible en fauteuil roulant",
  "Toilettes accessibles",
  "Stationnement accessible",
  "Entrée sans marches",
  "Service en bordure de trottoir",
];

const ChipGroup = ({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected.has(opt);
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
            active
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary/40"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const toSet = (arr?: string[] | null) => new Set(arr ?? []);

const EditAttributesModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<Set<string>>(() => toSet((business as any).payment_methods));
  const [languages, setLanguages] = useState<Set<string>>(() => toSet((business as any).languages));
  const [accessibility, setAccessibility] = useState<Set<string>>(() => toSet((business as any).accessibility));

  useEffect(() => {
    if (!open) return;
    setPayments(toSet((business as any).payment_methods));
    setLanguages(toSet((business as any).languages));
    setAccessibility(toSet((business as any).accessibility));
  }, [open, business.id]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void) => (value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        payment_methods: Array.from(payments),
        languages: Array.from(languages),
        accessibility: Array.from(accessibility),
      } as any)
      .eq("id", business.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Préférences sauvegardées" });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Paiements, langues, accessibilité</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Aidez vos clients à choisir en confiance en précisant ce que vous offrez.
        </p>

        <section className="space-y-2">
          <h3 className="font-heading font-semibold text-sm text-foreground">Modes de paiement</h3>
          <ChipGroup options={PAYMENT_METHODS} selected={payments} onToggle={toggle(payments, setPayments)} />
        </section>

        <section className="space-y-2 mt-5">
          <h3 className="font-heading font-semibold text-sm text-foreground">Langues parlées</h3>
          <ChipGroup options={LANGUAGES} selected={languages} onToggle={toggle(languages, setLanguages)} />
        </section>

        <section className="space-y-2 mt-5">
          <h3 className="font-heading font-semibold text-sm text-foreground">Accessibilité</h3>
          <ChipGroup options={ACCESSIBILITY} selected={accessibility} onToggle={toggle(accessibility, setAccessibility)} />
        </section>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAttributesModal;
