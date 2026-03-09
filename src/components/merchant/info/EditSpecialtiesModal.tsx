import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditSpecialtiesModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [text, setText] = useState(business.description || "");
  const maxLen = 1500;

  const handleSave = async () => {
    const { error } = await supabase.from("businesses").update({ description: text }).eq("id", business.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Spécialités mises à jour!" });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Spécialités</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez une brève description de votre entreprise et démarquez-vous auprès des clients.
        </p>

        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <p className="font-medium text-foreground mb-2">Qu'est-ce qui rend votre entreprise unique?</p>
          <Textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, maxLen))}
            rows={4}
            className="rounded-lg"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{maxLen - text.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Consultez nos <button className="text-primary underline">directives</button>
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSpecialtiesModal;
