import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, X } from "lucide-react";

// ── YES/NO toggle sections ──
const TOGGLE_SECTIONS = [
  {
    title: "Accessibility",
    items: [
      "Wheelchair Accessible",
      "ADA-compliant main entrance",
      "QR code menus available",
      "No steps or stairs",
      "ADA-compliant restroom",
      "ASL proficient",
      "Braille menus available",
      "Accessible parking near entrance",
      "Closed captioning on TVs",
    ],
  },
  {
    title: "Amenities",
    items: ["Drive-Thru", "Water Service", "Has ATM"],
  },
  {
    title: "Diversity",
    items: [
      "LGBTQ-owned",
      "Black-owned",
      "Veteran-owned",
      "Woman-owned",
      "Latino-owned",
      "Asian-owned",
    ],
  },
  {
    title: "Eco-friendly",
    items: [
      "Bike Parking",
      "Bring your own cup allowed",
      "Plastic-free packaging",
      "Compostable containers available",
      "Provides reusable tableware",
      "EV charging station available",
    ],
  },
  {
    title: "Family amenities",
    items: [
      "Child care available",
      "Changing tables",
      "Stroller parking",
      "High chairs",
      "Kids menu",
      "Play area",
      "Lactation room",
    ],
  },
  {
    title: "Food ordering",
    items: ["Offers Delivery", "Offers Takeout"],
  },
  {
    title: "Menu callouts",
    items: ["Bottomless mimosas", "Happy Hour Specials"],
  },
  {
    title: "Payments",
    items: ["Accepts cash"],
  },
  {
    title: "Reservations",
    items: ["Takes Reservations"],
  },
  {
    title: "Seating",
    items: [
      "Outdoor Seating",
      "Covered outdoor seating",
      "Heated outdoor seating",
      "Rooftop seating",
    ],
  },
  {
    title: "Services",
    items: ["Caters", "Private dining"],
  },
  {
    title: "Other",
    items: [
      "Dogs Allowed",
      "Good for Happy Hour",
      "Has TV",
      "Reusable cup discount",
    ],
  },
];

// ── CHIP / MULTI-SELECT sections ──
const CHIP_SECTIONS: { title: string; key: string; items: string[]; multi: boolean }[] = [
  { title: "Accepted Cards", key: "accepted_cards", items: ["Credit", "Debit", "None"], multi: true },
  { title: "Parking", key: "parking", items: ["Valet", "Garage", "Street", "Private Lot"], multi: true },
  { title: "Alcohol", key: "alcohol", items: ["Beer & Wine Only", "Full Bar", "No"], multi: false },
  { title: "Wi-Fi", key: "wifi", items: ["Free", "Paid", "No"], multi: false },
  { title: "Large parties gratuity", key: "large_party_gratuity", items: ["Gratuity included", "Tipping optional", "Tip"], multi: false },
  { title: "Tips", key: "tip", items: ["We suggest gratuity", "Tipping optional"], multi: false },
];

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => Promise<void> | void;
  isRefreshing?: boolean;
}

const EditAmenitiesModal = ({ open, onClose, business, onSaved, isRefreshing = false }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const skipAutoSaveRef = useRef(true);

  const parseAmenities = (amenities: string[] | null) => {
    const nextSelected = new Set<string>();
    const nextChips: Record<string, Set<string>> = {};

    CHIP_SECTIONS.forEach((section) => {
      nextChips[section.key] = new Set();
    });

    (amenities || []).forEach((amenity) => {
      const idx = amenity.indexOf("::");
      if (idx === -1) {
        nextSelected.add(amenity);
        return;
      }

      const prefix = amenity.substring(0, idx);
      const value = amenity.substring(idx + 2);
      if (nextChips[prefix]) nextChips[prefix].add(value);
    });

    return { nextSelected, nextChips };
  };

  const [initialState] = useState(() => parseAmenities(business.amenities));
  const { nextSelected: initialSelected, nextChips: initialChips } = initialState;
  const [selected, setSelected] = useState<Set<string>>(initialSelected);
  const [chips, setChips] = useState<Record<string, Set<string>>>(initialChips);

  const initialAmenities = useMemo(() => business.amenities || [], [business.amenities]);
  const allowedToggleItems = useMemo(() => new Set(TOGGLE_SECTIONS.flatMap(section => section.items)), []);
  const allowedChipItems = useMemo(() => {
    const map = new Map<string, Set<string>>();
    CHIP_SECTIONS.forEach((section) => {
      map.set(section.key, new Set(section.items));
    });
    return map;
  }, []);

  useEffect(() => {
    if (!open) return;
    const { nextSelected, nextChips } = parseAmenities(business.amenities);
    setSelected(nextSelected);
    setChips(nextChips);
    setSavedNotice(null);
    skipAutoSaveRef.current = true;
  }, [open, business.id, business.amenities]);

  const normalizedAmenities = useMemo(() => {
    const toggleAmenities = Array.from(selected);
    const chipAmenities: string[] = [];
    Object.entries(chips).forEach(([key, vals]) => {
      vals.forEach(v => chipAmenities.push(`${key}::${v}`));
    });

    return [...toggleAmenities, ...chipAmenities].sort((a, b) => a.localeCompare(b));
  }, [selected, chips]);

  const hasChanges = useMemo(() => {
    const current = [...initialAmenities].sort((a, b) => a.localeCompare(b));
    return JSON.stringify(current) !== JSON.stringify(normalizedAmenities);
  }, [initialAmenities, normalizedAmenities]);

  const controlsDisabled = saving || isRefreshing;

  const toggleItem = (item: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  };

  const toggleChip = (key: string, value: string, multi: boolean) => {
    setChips(prev => {
      const next = { ...prev };
      const set = new Set(prev[key]);
      if (multi) {
        if (value === "None") {
          if (set.has(value)) {
            set.delete(value);
          } else {
            set.clear();
            set.add(value);
          }
        } else {
          set.delete("None");
          if (set.has(value)) set.delete(value); else set.add(value);
        }
      } else {
        if (set.has(value)) { set.clear(); } else { set.clear(); set.add(value); }
      }
      next[key] = set;
      return next;
    });
  };

  const validateAmenities = () => {
    const invalidToggleItems = Array.from(selected).filter(item => !allowedToggleItems.has(item));
    const invalidChipItems = Object.entries(chips).flatMap(([key, values]) => {
      const allowed = allowedChipItems.get(key);
      return Array.from(values)
        .filter(value => !allowed?.has(value))
        .map(value => `${key}::${value}`);
    });

    const invalidItems = [...invalidToggleItems, ...invalidChipItems];
    if (invalidItems.length > 0) {
      toast({
        title: "Sélection invalide",
        description: "Certaines commodités ne sont pas reconnues. Veuillez réessayer.",
        variant: "destructive",
      });
      return null;
    }

    return normalizedAmenities;
  };

  const handleSave = async (source: "manual" | "auto" = "manual") => {
    const validatedAmenities = validateAmenities();
    if (!validatedAmenities) return;

    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({ amenities: validatedAmenities })
      .select("amenities")
      .eq("id", business.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      await onSaved();
      setSavedNotice(source === "auto" ? "Enregistré automatiquement" : "Commodités enregistrées");
      toast({ title: "Commodités sauvegardées", description: "La section Commodités a été actualisée." });
      if (source === "manual") onClose();
    }
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
  }, [normalizedAmenities, autoSave, hasChanges, isRefreshing, saving, open]);

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

        <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-sm font-medium text-foreground">Quick test checklist</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• Choose Yes or No for a Commodités row.</li>
            <li>• Save or let auto-save confirm the update.</li>
            <li>• Re-open the modal and verify the selection stayed selected.</li>
            <li>• Refresh the page and confirm the same toggle still persists.</li>
          </ul>
        </div>

        {isRefreshing ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/20">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement des commodités actuelles…</p>
          </div>
        ) : (

        <div className="space-y-6">
          {/* ── YES / NO toggle sections ── */}
          {TOGGLE_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="font-heading font-bold text-foreground mb-2 text-base">{section.title}</h3>
              <div className="divide-y divide-border">
                {section.items.map(item => {
                  const isYes = selected.has(item);
                  return (
                    <div key={item} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-foreground flex-1 pr-3">{item}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={controlsDisabled}
                          onClick={() => { if (!isYes) toggleItem(item); }}
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
                          onClick={() => { if (isYes) toggleItem(item); }}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                            !isYes
                              ? "bg-muted text-foreground"
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

          {/* ── CHIP selector sections ── */}
          {CHIP_SECTIONS.map(section => (
            <div key={section.key}>
              <h3 className="font-heading font-bold text-foreground mb-2 text-base">{section.title}</h3>
              <div className="flex flex-wrap gap-2">
                {section.items.map(item => {
                  const isActive = chips[section.key]?.has(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      disabled={controlsDisabled}
                      onClick={() => toggleChip(section.key, item, section.multi)}
                      className={`text-sm px-4 py-2 rounded-full font-medium border transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      } ${controlsDisabled ? "opacity-50" : ""}`}
                    >
                      {item}
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
          <Button onClick={() => handleSave("manual")} disabled={controlsDisabled || !hasChanges} className="min-w-[120px]">
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
