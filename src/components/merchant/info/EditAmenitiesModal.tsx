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
    title: "Accessibilité",
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
    title: "Commodités",
    items: ["Drive-Thru", "Water Service", "Has ATM"],
  },
  {
    title: "Diversité",
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
    title: "Éco-responsable",
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
    title: "Commodités familiales",
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
    title: "Commande de nourriture",
    items: ["Offers Delivery", "Offers Takeout"],
  },
  {
    title: "Divers",
    items: ["Bottomless mimosas", "Happy Hour Specials"],
  },
  {
    title: "Paiements",
    items: ["Accepts cash"],
  },
  {
    title: "Réservations",
    items: ["Takes Reservations"],
  },
  {
    title: "Places assises",
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
    title: "Autre",
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
  { title: "Cartes acceptées", key: "accepted_cards", items: ["Credit", "Debit", "None"], multi: true },
  { title: "Stationnement", key: "parking", items: ["Valet", "Garage", "Street", "Private Lot"], multi: true },
  { title: "Alcool", key: "alcohol", items: ["Beer & Wine Only", "Full Bar", "No"], multi: false },
  { title: "Wi-Fi", key: "wifi", items: ["Free", "Paid", "No"], multi: false },
  { title: "Pourboire gros groupes", key: "large_party_gratuity", items: ["Gratuity included", "Tipping optional"], multi: false },
  { title: "Pourboire", key: "tip", items: ["We suggest gratuity", "Tipping optional"], multi: false },
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

  // Parse existing amenities into a Set for toggle items
  const [selected, setSelected] = useState<Set<string>>(() => new Set(business.amenities || []));

  // Parse chip selections from amenities (stored as "key::value")
  const [chips, setChips] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    CHIP_SECTIONS.forEach(s => { map[s.key] = new Set(); });
    (business.amenities || []).forEach(a => {
      const [prefix, val] = a.split("::");
      if (val && map[prefix]) map[prefix].add(val);
    });
    return map;
  });

  const toggleItem = (item: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  const toggleChip = (key: string, value: string, multi: boolean) => {
    setChips(prev => {
      const next = { ...prev };
      const set = new Set(prev[key]);
      if (multi) {
        set.has(value) ? set.delete(value) : set.add(value);
      } else {
        if (set.has(value)) { set.clear(); } else { set.clear(); set.add(value); }
      }
      next[key] = set;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Build final amenities array
    const toggleAmenities = Array.from(selected).filter(s => !s.includes("::"));
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
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Commodités et plus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez les commodités offertes. Elles s'afficheront sur votre page QMAPS.
          </p>
        </div>

        <div className="px-6 pb-4 space-y-6">
          {/* YES / NO toggle sections */}
          {TOGGLE_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="font-heading font-bold text-foreground mb-3">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map(item => {
                  const isYes = selected.has(item);
                  return (
                    <div key={item} className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground pr-2">{item}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { if (!isYes) toggleItem(item); }}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            isYes
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => { if (isYes) toggleItem(item); }}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            !isYes
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CHIP sections */}
          {CHIP_SECTIONS.map(section => (
            <div key={section.key}>
              <h3 className="font-heading font-bold text-foreground mb-3">{section.title}</h3>
              <div className="flex flex-wrap gap-2">
                {section.items.map(item => {
                  const isActive = chips[section.key]?.has(item);
                  return (
                    <button
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

        {/* Sticky save bar */}
        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin mr-2" />}
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAmenitiesModal;
