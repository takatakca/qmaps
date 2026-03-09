import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditHistoryModal = ({ open, onClose, business, onSaved }: Props) => {
  const [year, setYear] = useState("2023");
  const [history, setHistory] = useState("");
  const maxLen = 1000;

  const handleSave = () => {
    // Would persist to a dedicated field/table in production
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Historique</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez une brève description de l'origine et du parcours de votre entreprise.
        </p>

        <div className="bg-muted/50 rounded-xl p-4 mb-4 space-y-4">
          <div>
            <Label className="font-medium">En quelle année votre entreprise a-t-elle été fondée?</Label>
            <Input value={year} onChange={e => setYear(e.target.value)} className="rounded-lg mt-1" />
          </div>
          <div>
            <Label className="font-medium">Quelle est l'histoire de votre entreprise?</Label>
            <Textarea
              value={history}
              onChange={e => setHistory(e.target.value.slice(0, maxLen))}
              rows={4}
              className="rounded-lg mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{maxLen - history.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Consultez nos <button className="text-primary underline">directives</button>
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditHistoryModal;
