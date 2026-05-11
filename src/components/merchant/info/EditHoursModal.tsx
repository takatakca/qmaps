import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DAYS,
  DAY_LABELS_FR,
  defaultWeeklyHours,
  formatDayHours,
  isValidBlock,
  parseWeeklyHours,
  summarizeWeeklyHours,
  type WeeklyHours,
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

const EditHoursModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [week, setWeek] = useState<WeeklyHours>(() =>
    parseWeeklyHours((business as any).hours_json) ?? defaultWeeklyHours(),
  );

  useEffect(() => {
    if (!open) return;
    setWeek(parseWeeklyHours((business as any).hours_json) ?? defaultWeeklyHours());
  }, [open, business.id]);

  const updateDay = (day: keyof WeeklyHours, patch: Partial<WeeklyHours[keyof WeeklyHours]>) => {
    setWeek((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const updateBlock = (day: keyof WeeklyHours, idx: number, patch: Partial<{ open: string; close: string }>) => {
    setWeek((prev) => {
      const blocks = [...prev[day].blocks];
      blocks[idx] = { ...blocks[idx], ...patch };
      return { ...prev, [day]: { ...prev[day], blocks } };
    });
  };

  const addBlock = (day: keyof WeeklyHours) => {
    setWeek((prev) => {
      const blocks = [...prev[day].blocks];
      if (blocks.length >= 2) return prev;
      blocks.push({ open: "09:00", close: "17:00" });
      return { ...prev, [day]: { ...prev[day], closed: false, blocks } };
    });
  };

  const removeBlock = (day: keyof WeeklyHours, idx: number) => {
    setWeek((prev) => {
      const blocks = prev[day].blocks.filter((_, i) => i !== idx);
      return { ...prev, [day]: { ...prev[day], blocks, closed: blocks.length === 0 ? true : prev[day].closed } };
    });
  };

  const toggleClosed = (day: keyof WeeklyHours, closed: boolean) => {
    setWeek((prev) => ({
      ...prev,
      [day]: closed
        ? { ...prev[day], closed: true, blocks: [] }
        : { ...prev[day], closed: false, blocks: prev[day].blocks.length ? prev[day].blocks : [{ open: "09:00", close: "17:00" }] },
    }));
  };

  const handleSave = async () => {
    // Validate every active block.
    for (const d of DAYS) {
      const day = week[d];
      if (day.closed) continue;
      for (const b of day.blocks) {
        if (!isValidBlock(b)) {
          toast({
            title: "Heures invalides",
            description: `${DAY_LABELS_FR[d]}: l'heure de fermeture doit être après l'ouverture.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSaving(true);
    const text = summarizeWeeklyHours(week);
    const { error } = await supabase
      .from("businesses")
      .update({ hours_json: week as any, hours: text })
      .eq("id", business.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Heures sauvegardées" });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Heures d'ouverture</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Définissez vos heures hebdomadaires. Vous pouvez ajouter une seconde plage par jour pour les pauses.
        </p>

        <div className="space-y-5">
          {DAYS.map((d) => {
            const day = week[d];
            return (
              <div key={d} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{DAY_LABELS_FR[d]}</p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {day.closed ? "Fermé" : "Ouvert"}
                    <Switch
                      checked={!day.closed}
                      onCheckedChange={(checked) => toggleClosed(d, !checked)}
                    />
                  </label>
                </div>

                {day.closed ? (
                  <p className="text-xs text-muted-foreground">Fermé toute la journée</p>
                ) : (
                  <div className="space-y-2">
                    {day.blocks.map((b, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[11px] text-muted-foreground">De</label>
                          <select
                            value={b.open}
                            onChange={(e) => updateBlock(d, idx, { open: e.target.value })}
                            className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                          >
                            {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] text-muted-foreground">À</label>
                          <select
                            value={b.close}
                            onChange={(e) => updateBlock(d, idx, { close: e.target.value })}
                            className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                          >
                            {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        {day.blocks.length > 1 && (
                          <button
                            type="button"
                            aria-label="Retirer la plage"
                            onClick={() => removeBlock(d, idx)}
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
                        onClick={() => addBlock(d)}
                        className="text-xs text-primary font-medium inline-flex items-center gap-1"
                      >
                        <Plus size={12} /> Ajouter une plage
                      </button>
                    )}
                    <p className="text-[11px] text-muted-foreground">{formatDayHours(day)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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

export default EditHoursModal;
