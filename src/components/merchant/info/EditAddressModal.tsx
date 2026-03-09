import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const PROVINCES = ["Alberta", "Colombie-Britannique", "Manitoba", "Nouveau-Brunswick", "Terre-Neuve-et-Labrador", "Nouvelle-Écosse", "Ontario", "Île-du-Prince-Édouard", "Québec", "Saskatchewan"];

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditAddressModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [address, setAddress] = useState(business.address);
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState(business.city);
  const [province, setProvince] = useState(business.region || "Québec");
  const [postalCode, setPostalCode] = useState(business.postal_code || "");

  const handleSave = async () => {
    const fullAddr = address2 ? `${address}, ${address2}` : address;
    const { error } = await supabase.from("businesses").update({
      address: fullAddr,
      city,
      region: province,
      postal_code: postalCode,
    }).eq("id", business.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Adresse mise à jour!" });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Adresse de l'entreprise</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <p className="font-medium text-foreground mb-1">Ajoutez votre adresse</p>
          <p className="text-xs text-muted-foreground">Consultez nos directives ⓘ</p>

          <div className="space-y-3 mt-3">
            <div>
              <Label className="text-sm font-medium">Adresse 1</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} className="rounded-lg mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Adresse 2 <span className="text-muted-foreground font-normal">(Optionnel)</span></Label>
              <Input value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Ste 200" className="rounded-lg mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Ville</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} className="rounded-lg mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Province</Label>
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Code postal</Label>
              <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} className="rounded-lg mt-1" />
            </div>
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

export default EditAddressModal;
