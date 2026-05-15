import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

/**
 * Phase 3 note: the underlying `businesses` table has no `history` /
 * `founded_year` columns yet. Persisting these fields requires the schema
 * work scheduled for Phase 4/5. To avoid silently dropping merchant input
 * (the previous version of this modal kept inputs but never wrote them),
 * we now show an explicit "coming soon" state instead of a fake form.
 */
const EditHistoryModal = ({ open, onClose }: Props) => {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Historique</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-xl p-4 mb-4 flex gap-3">
          <Info size={18} className="text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">Bientôt disponible</p>
            <p className="text-muted-foreground">
              L'historique de votre entreprise (année de fondation, parcours)
              sera disponible dans une prochaine mise à jour. En attendant,
              ajoutez ces informations dans la section <strong>Spécialités</strong>.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditHistoryModal;
