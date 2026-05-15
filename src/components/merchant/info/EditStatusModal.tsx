import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import {
  BUSINESS_STATUS_VALUES,
  STATUS_LABELS,
  flagsForStatus,
  readBusinessStatus,
  type BusinessStatus,
} from "@/lib/businessStatus";

const TONE_DOT: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  destructive: "bg-destructive",
  info: "bg-blue-500",
  muted: "bg-muted-foreground",
};

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditStatusModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<BusinessStatus>(() =>
    readBusinessStatus(business as { status?: string | null; is_open?: boolean | null; is_active?: boolean | null }),
  );

  const handleSave = async () => {
    setSaving(true);
    const updates = flagsForStatus(status);
    const { error } = await supabase
      .from("businesses")
      .update(updates as never)
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
    <Dialog open={open} onOpenChange={v => !v && !saving && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Statut de l'entreprise</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Contrôlez la visibilité et l'état opérationnel de votre entreprise sur QMAPS.
        </p>

        <div className="space-y-2">
          {BUSINESS_STATUS_VALUES.map(value => {
            const meta = STATUS_LABELS[value];
            const selected = status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${TONE_DOT[meta.tone] ?? "bg-muted-foreground"}`} />
                <span className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Les entreprises masquées ou définitivement fermées ne sont pas visibles
          dans la recherche publique. Les entreprises temporairement fermées et
          saisonnières restent visibles avec un libellé approprié.
        </p>

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
