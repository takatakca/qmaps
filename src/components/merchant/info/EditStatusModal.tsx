import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const STATUS_OPTIONS = [
  { value: "open", label: "Ouvert / En opération", color: "bg-green-500" },
  { value: "temporarily_closed", label: "Temporairement fermé", color: "bg-amber-500" },
  { value: "permanently_closed", label: "Définitivement fermé", color: "bg-destructive" },
  { value: "seasonal", label: "Saisonnier / En pause", color: "bg-blue-500" },
  { value: "hidden", label: "Masqué de la liste publique", color: "bg-muted-foreground" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditStatusModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Derive initial status from is_open + is_active
  const deriveStatus = () => {
    if (!business.is_active) return "hidden";
    if (business.is_open) return "open";
    return "temporarily_closed";
  };
  const [status, setStatus] = useState(deriveStatus);

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {};

    switch (status) {
      case "open":
        updates.is_open = true;
        updates.is_active = true;
        break;
      case "temporarily_closed":
        updates.is_open = false;
        updates.is_active = true;
        break;
      case "permanently_closed":
        updates.is_open = false;
        updates.is_active = false;
        break;
      case "seasonal":
        updates.is_open = false;
        updates.is_active = true;
        break;
      case "hidden":
        updates.is_active = false;
        updates.is_open = false;
        break;
    }

    const { error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", business.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Statut mis à jour!" });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Statut de l'entreprise</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Contrôlez la visibilité et l'état opérationnel de votre entreprise sur QMAPS.
        </p>

        <div className="space-y-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                status === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${opt.color}`} />
              <span className={`text-sm font-medium ${status === opt.value ? "text-primary" : "text-foreground"}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin mr-2" />}
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStatusModal;
