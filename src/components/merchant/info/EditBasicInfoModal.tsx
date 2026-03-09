import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditBasicInfoModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone || "");
  const [website, setWebsite] = useState(business.website || "");
  const [menuLink, setMenuLink] = useState("");

  const handleSave = async () => {
    const { error } = await supabase.from("businesses").update({
      name,
      phone,
      website,
    }).eq("id", business.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Informations mises à jour!" });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Informations de base</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          QMAPS vérifiera vos modifications en visitant votre site web et vos profils de réseaux sociaux après soumission.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="font-medium">Nom de l'entreprise</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="rounded-lg mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Ne pas inclure l'adresse, le numéro de magasin ou les licences (Inc., LLC, PLC).</p>
          </div>
          <div>
            <Label className="font-medium">Numéro de téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="rounded-lg mt-1" />
            <p className="text-xs text-muted-foreground mt-1">N'utilisez pas de numéros de suivi ou payants.</p>
          </div>
          <div>
            <Label className="font-medium">Lien du site web <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" className="rounded-lg mt-1" />
            <p className="text-xs text-muted-foreground mt-1">N'utilisez pas de sites tiers.</p>
          </div>
          <div>
            <Label className="font-medium">Lien du menu <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
            <Input value={menuLink} onChange={e => setMenuLink(e.target.value)} placeholder="https://" className="rounded-lg mt-1" />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBasicInfoModal;
