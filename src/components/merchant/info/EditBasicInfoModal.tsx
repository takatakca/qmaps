import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone || "");
  const [website, setWebsite] = useState(business.website || "");
  const [saving, setSaving] = useState(false);

  // Re-sync local state if a different business is loaded while modal is mounted.
  useEffect(() => {
    if (open) {
      setName(business.name);
      setPhone(business.phone || "");
      setWebsite(business.website || "");
    }
  }, [open, business.id, business.name, business.phone, business.website]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nom requis", description: "Le nom de l'entreprise ne peut pas être vide.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("businesses").update({
      name: name.trim(),
      phone: phone.trim() || null,
      website: website.trim() || null,
    }).eq("id", business.id);
    setSaving(false);

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
