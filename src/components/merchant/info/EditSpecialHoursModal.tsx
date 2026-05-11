import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  formatDateKey,
  isValidBlock,
  parseSpecialHours,
  type DayHours,
  type SpecialHours,
} from "@/lib/businessHours";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const HOURS_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const todayKey = () => formatDateKey(new Date());

const EditSpecialHoursModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [special, setSpecial] = useState<SpecialHours>({});
  const [newDate, setNewDate] = useState<string>(todayKey());

  useEffect(() => {
    if (!open) return;
    setSpecial(parseSpecialHours((business as any).special_hours) ?? {});
    setNewDate(todayKey());
  }, [open, business.id]);

  const updateDay = (date: string, patch: Partial<DayHours>) => {
    setSpecial((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));
  };

  const addDate = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      toast({ title: "Date invalide", description: "Utilisez le format YYYY-MM-DD.", variant: "destructive" });
      return;
    }
    if (special[newDate]) {
      toast({ title: "Date déjà ajoutée" });
      return;
    }
    setSpecial((prev) => ({
      ...prev,
      [newDate]: { closed: true, blocks: [], note: "" },
    }));
  };

  const removeDate = (date: string) => {
    setSpecial((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  };

  const toggleClosed = (date: string, closed: boolean) => {
    setSpecial((prev) => ({
      ...prev,
      [date]: closed
        ? { ...prev[date], closed: true, blocks: [] }
        : {
            ...prev[date],
            closed: false,
            blocks: prev[date].blocks.length ? prev[date].blocks : [{ open: "10:00", close: "16:00" }],
          },
    }));
  };

  const updateBlock = (date: string, idx: number, patch: Partial<{ open: string; close: string }>) => {
    setSpecial((prev) => {
      const blocks = [...prev[date].blocks];
      blocks[idx] = { ...blocks[idx], ...patch };
      return { ...prev, [date]: { ...prev[date], blocks } };
    });
  };

  const addBlock = (date: string) => {
    setSpecial((prev) => {
      const blocks = [...prev[date].blocks];
      if (blocks.length >= 2) return prev;
      blocks.push({ open: "09:00", close: "17:00" });
      return { ...prev, [date]: { ...prev[date], closed: false, blocks } };
    });
  };

  const removeBlock = (date: string, idx: number) => {
    setSpecial((prev) => {
      const blocks = prev[date].blocks.filter((_, i) => i !== idx);
      return {
        ...prev,
        [date]: { ...prev[date], blocks, closed: blocks.length === 0 ? true : prev[date].closed },
      };
    });
  };

  const handleSave = async () => {
    for (const [date, day] of Object.entries(special)) {
      if (day.closed) continue;
      for (const b of day.blocks) {
        if (!isValidBlock(b)) {
          toast({
            title: "Heures invalides",
            description: `${date}: l'heure de fermeture doit être après l'ouverture.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSaving(true);
    const payload = Object.keys(special).length === 0 ? null : special;
    const { error } = await supabase
      .from("businesses")
      .update({ special_hours: payload as any })
      .eq("id", business.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Heures spéciales sauvegardées" });
    onSaved();
    onClose();
  };

  const dates = Object.keys(special).sort();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Heures spéciales</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          Définissez des horaires pour des jours fériés ou des évènements. Ils remplacent les heures hebdomadaires
          uniquement pour ces dates.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addDate} className="gap-1"><Plus size={14} /> Ajouter</Button>
        </div>

        {dates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune date spéciale.</p>
        ) : (
          <div className="space-y-5">
            {dates.map((date) => {
              const day = special[date];
              return (
                <div key={date} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{date}</p>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        {day.closed ? "Fermé" : "Ouvert"}
                        <Switch
                          checked={!day.closed}
                          onCheckedChange={(checked) => toggleClosed(date, !checked)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDate(date)}
                        aria-label="Retirer cette date"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {!day.closed && (
                    <div className="space-y-2">
                      {day.blocks.map((b, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-[11px] text-muted-foreground">De</label>
                            <select
                              value={b.open}
                              onChange={(e) => updateBlock(date, idx, { open: e.target.value })}
                              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                            >
                              {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[11px] text-muted-foreground">À</label>
                            <select
                              value={b.close}
                              onChange={(e) => updateBlock(date, idx, { close: e.target.value })}
                              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                            >
                              {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          {day.blocks.length > 1 && (
                            <button
                              type="button"
                              aria-label="Retirer la plage"
                              onClick={() => removeBlock(date, idx)}
                              className="p-2 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      {day.blocks.length < 2 && (
                        <button
                          type="button"
                          onClick={() => addBlock(date)}
                          className="text-xs text-primary font-medium inline-flex items-center gap-1"
                        >
                          <Plus size={12} /> Ajouter une plage
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-2">
                    <label className="text-[11px] text-muted-foreground">Note (facultatif)</label>
                    <Input
                      value={day.note ?? ""}
                      onChange={(e) => updateDay(date, { note: e.target.value })}
                      placeholder="Ex: Réveillon, Fête nationale…"
                      maxLength={100}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSpecialHoursModal;
