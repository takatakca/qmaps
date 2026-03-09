import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

interface DayHours {
  from: string;
  to: string;
  open24: boolean;
  closed: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditHoursModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [days, setDays] = useState<DayHours[]>(
    DAYS.map(() => ({ from: "09:00", to: "17:00", open24: false, closed: false }))
  );

  const updateDay = (idx: number, patch: Partial<DayHours>) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const handleSave = async () => {
    const hoursStr = DAYS.map((name, i) => {
      const d = days[i];
      if (d.closed) return `${name}: Fermé`;
      if (d.open24) return `${name}: 24h`;
      return `${name}: ${d.from} - ${d.to}`;
    }).join(", ");

    const { error } = await supabase.from("businesses").update({ hours: hoursStr }).eq("id", business.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Heures sauvegardées!" });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Heures d'ouverture</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez vos heures d'ouverture pour que les clients sachent quand vous êtes ouvert.
        </p>

        <div className="space-y-6">
          {DAYS.map((day, idx) => (
            <div key={day}>
              <p className="font-medium text-foreground mb-2">{day}</p>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">De</label>
                  <select
                    value={days[idx].from}
                    onChange={e => updateDay(idx, { from: e.target.value })}
                    disabled={days[idx].open24 || days[idx].closed}
                    className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">À</label>
                  <select
                    value={days[idx].to}
                    onChange={e => updateDay(idx, { to: e.target.value })}
                    disabled={days[idx].open24 || days[idx].closed}
                    className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={days[idx].open24}
                    onCheckedChange={v => updateDay(idx, { open24: !!v, closed: false })}
                  />
                  Ouvert 24h
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={days[idx].closed}
                    onCheckedChange={v => updateDay(idx, { closed: !!v, open24: false })}
                  />
                  Fermé
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditHoursModal;
