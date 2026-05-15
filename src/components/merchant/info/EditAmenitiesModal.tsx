import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, X } from "lucide-react";
import {
  BOOLEAN_GROUPS,
  CHOICE_GROUPS,
  emptyAttributes,
  parseAttributes,
  sanitizeAttributes,
  toLegacyAmenities,
  type StructuredAttributes,
} from "@/lib/businessAttributes";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => Promise<void> | void;
  isRefreshing?: boolean;
}

const cloneAttrs = (a: StructuredAttributes): StructuredAttributes => ({
  boolean: { ...a.boolean },
  single: { ...a.single },
  multi: Object.fromEntries(Object.entries(a.multi).map(([k, v]) => [k, [...v]])),
});

const EditAmenitiesModal = ({ open, onClose, business, onSaved, isRefreshing = false }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const skipAutoSaveRef = useRef(true);

  const initial = useMemo(
    () => parseAttributes({ attributes: (business as any).attributes, amenities: business.amenities }),
    [business.id]
  );
  const [state, setState] = useState<StructuredAttributes>(() => cloneAttrs(initial));
  const [baseline, setBaseline] = useState<StructuredAttributes>(() => cloneAttrs(initial));

  useEffect(() => {
    if (!open) return;
    const next = parseAttributes({
      attributes: (business as any).attributes,
      amenities: business.amenities,
    });
    setState(cloneAttrs(next));
    setBaseline(cloneAttrs(next));
    setSavedNotice(null);
    skipAutoSaveRef.current = true;
  }, [open, business.id, business.amenities, (business as any).attributes]);

  const hasChanges = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(baseline),
    [state, baseline]
  );

  const controlsDisabled = saving || isRefreshing;

  const setBoolean = (key: string, value: boolean) =>
    setState((prev) => ({ ...prev, boolean: { ...prev.boolean, [key]: value } }));

  const setSingle = (groupId: string, value: string) =>
    setState((prev) => {
      const next = { ...prev.single };
      if (next[groupId] === value) delete next[groupId];
      else next[groupId] = value;
      return { ...prev, single: next };
    });

  const toggleMulti = (groupId: string, value: string) =>
    setState((prev) => {
      const cur = prev.multi[groupId] ?? [];
      let nextVals: string[];
      if (value === "None") {
        nextVals = cur.includes("None") ? [] : ["None"];
      } else {
        const without = cur.filter((v) => v !== "None");
        nextVals = without.includes(value)
          ? without.filter((v) => v !== value)
          : [...without, value];
      }
      const nextMulti = { ...prev.multi };
      if (nextVals.length === 0) delete nextMulti[groupId];
      else nextMulti[groupId] = nextVals;
      return { ...prev, multi: nextMulti };
    });

  const handleSave = async (source: "manual" | "auto" = "manual") => {
    const sanitized = sanitizeAttributes(state);
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        attributes: sanitized as any,
        amenities: toLegacyAmenities(sanitized),
      } as any)
      .eq("id", business.id);
    setSaving(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setBaseline(cloneAttrs(sanitized));
    setState(cloneAttrs(sanitized));
    await onSaved();
    setSavedNotice(source === "auto" ? "Enregistré automatiquement" : "Commodités enregistrées");
    toast({ title: "Commodités sauvegardées", description: "La section Commodités a été actualisée." });
    if (source === "manual") onClose();
  };

  useEffect(() => {
    if (!open || !autoSave || isRefreshing || saving) return;
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    if (!hasChanges) return;
    const timeout = setTimeout(() => {
      handleSave("auto");
    }, 500);
    return () => clearTimeout(timeout);
  }, [state, autoSave, hasChanges, isRefreshing, saving, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      <div className="fixed inset-x-0 top-1/2 z-50 mx-auto w-full max-w-md -translate-y-1/2 border bg-background p-6 shadow-lg sm:rounded-lg">
        <div className="absolute right-4 top-4">
          <button type="button" onClick={onClose} className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto pr-1">
          <div className="mb-4 text-center sm:text-left">
            <h2 className="font-heading text-xl font-bold text-foreground">Amenities and more</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Select the amenities you offer. They will appear on your QMAPS listing.
          </p>

          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-save</p>
                <p className="text-xs text-muted-foreground">Save each Commodités change automatically.</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoSave((prev) => !prev)}
                disabled={controlsDisabled}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  autoSave ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
                } ${controlsDisabled ? "opacity-50" : ""}`}
              >
                {autoSave ? "On" : "Off"}
              </button>
            </div>
            {savedNotice && <p className="mt-2 text-xs text-primary">{savedNotice}</p>}
          </div>

          {isRefreshing ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/20">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chargement des commodités actuelles…</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Boolean Yes/No groups */}
              {BOOLEAN_GROUPS.map((group) => (
                <div key={group.id} data-group-id={group.id}>
                  <h3 className="font-heading font-bold text-foreground mb-2 text-base">{group.title}</h3>
                  <div className="divide-y divide-border">
                    {group.options.map((opt) => {
                      const isYes = state.boolean[opt.key] === true;
                      const isNo = state.boolean[opt.key] === false;
                      return (
                        <div key={opt.key} className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-foreground flex-1 pr-3">{opt.label}</span>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={controlsDisabled}
                              onClick={() => setBoolean(opt.key, true)}
                              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                                isYes
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              } ${controlsDisabled ? "opacity-50" : ""}`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              disabled={controlsDisabled}
                              onClick={() => setBoolean(opt.key, false)}
                              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                                isNo
                                  ? "bg-foreground text-background"
                                  : "bg-transparent text-muted-foreground hover:bg-accent"
                              } ${controlsDisabled ? "opacity-50" : ""}`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Choice (single/multi-select) groups */}
              {CHOICE_GROUPS.map((group) => (
                <div key={group.id} data-group-id={group.id}>
                  <h3 className="font-heading font-bold text-foreground mb-2 text-base">{group.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((opt) => {
                      const isActive =
                        group.kind === "single"
                          ? state.single[group.id] === opt.key
                          : (state.multi[group.id] ?? []).includes(opt.key);
                      return (
                        <button
                          type="button"
                          key={opt.key}
                          disabled={controlsDisabled}
                          onClick={() =>
                            group.kind === "single"
                              ? setSingle(group.id, opt.key)
                              : toggleMulti(group.id, opt.key)
                          }
                          className={`text-sm px-4 py-2 rounded-full font-medium border transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-primary/40"
                          } ${controlsDisabled ? "opacity-50" : ""}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save bar */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border mt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              onClick={() => handleSave("manual")}
              disabled={controlsDisabled || !hasChanges}
              className="min-w-[120px]"
            >
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAmenitiesModal;
