import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  business: Tables<"businesses">;
  onSaved: () => void;
}

const MerchantEditForm = ({ business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(business.name);
  const [desc, setDesc] = useState(business.description || "");
  const [phone, setPhone] = useState(business.phone || "");
  const [address, setAddress] = useState(business.address);
  const [hours, setHours] = useState(business.hours || "");
  const [price, setPrice] = useState(business.price_level || 1);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({ name, description: desc, phone, address, hours, price_level: price })
      .eq("id", business.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sauvegardé!" });
      onSaved();
    }
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div><Label>Nom</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} /></div>
      <div><Label>Téléphone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
      <div><Label>Adresse</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
      <div><Label>Heures</Label><Input value={hours} onChange={e => setHours(e.target.value)} placeholder="9h - 17h" /></div>
      <div>
        <Label>Niveau de prix</Label>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => setPrice(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                price === p ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
              }`}
            >
              {"$".repeat(p)}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={handleSave} className="w-full rounded-full gap-2" disabled={saving}>
        <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder"}
      </Button>
    </div>
  );
};

export default MerchantEditForm;
