import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

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
  onSaved: () => void;
}

const EditAmenitiesModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const set = new Set<string>();
    (business.amenities || []).forEach(a => {
      if (!a.includes("::")) set.add(a);
    });
    return set;
  });

  const [chips, setChips] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    CHIP_SECTIONS.forEach(s => { map[s.key] = new Set(); });
    (business.amenities || []).forEach(a => {
      const idx = a.indexOf("::");
      if (idx > -1) {
        const prefix = a.substring(0, idx);
        const val = a.substring(idx + 2);
        if (map[prefix]) map[prefix].add(val);
      }
    });
    return map;
  });

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
        if (set.has(value)) set.delete(value); else set.add(value);
      } else {
        if (set.has(value)) { set.clear(); } else { set.clear(); set.add(value); }
      }
      next[key] = set;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const toggleAmenities = Array.from(selected);
    const chipAmenities: string[] = [];
    Object.entries(chips).forEach(([key, vals]) => {
      vals.forEach(v => chipAmenities.push(`${key}::${v}`));
    });

    const { error } = await supabase
      .from("businesses")
      .update({ amenities: [...toggleAmenities, ...chipAmenities] })
      .eq("id", business.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Commodités mises à jour!" });
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Amenities and more</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Select the amenities you offer. They will appear on your QMAPS listing.
        </p>

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
                          onClick={() => { if (!isYes) toggleItem(item); }}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                            isYes
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (isYes) toggleItem(item); }}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                            !isYes
                              ? "bg-muted text-foreground"
                              : "bg-transparent text-muted-foreground hover:bg-accent"
                          }`}
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
                      onClick={() => toggleChip(section.key, item, section.multi)}
                      className={`text-sm px-4 py-2 rounded-full font-medium border transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Save bar */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAmenitiesModal;
