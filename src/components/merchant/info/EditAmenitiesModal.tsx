import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const AMENITY_SECTIONS = [
  {
    title: "Accessibilité",
    items: ["Accessible en fauteuil roulant", "Stationnement accessible", "Toilettes accessibles", "Pas d'escaliers"],
  },
  {
    title: "Commodités",
    items: ["Wi-Fi gratuit", "Terrasse", "Climatisation", "Chauffage", "Service au volant", "Table de service rapide", "BYOB"],
  },
  {
    title: "Diversité",
    items: ["Propriété noire", "Propriété latino", "Propriété féminine", "LGBTQ+", "Propriété asiatique", "Propriété vétéran"],
  },
  {
    title: "Éco-responsable",
    items: ["Stationnement vélo", "Covoiturage encouragé", "Station de recharge VÉ", "Eau filtrée gratuite", "Produits locaux"],
  },
  {
    title: "Commodités familiales",
    items: ["Station de recharge", "Garderie disponible", "Chaises hautes", "Salle de bain familiale", "Zone de jeux", "Stationnement poussette"],
  },
  {
    title: "Commande de nourriture",
    items: ["Commande en ligne", "Livraison à emporter"],
  },
  {
    title: "Callouts de menu",
    items: ["Sans gluten", "Végétalien", "Végétarien", "Happy Hour", "Options bio"],
  },
  {
    title: "Paiements",
    items: ["Carte de crédit", "Carte de débit", "Comptant", "Apple Pay", "Google Pay", "Paiement sans contact"],
  },
  {
    title: "Réservations",
    items: ["Réservation en ligne", "Réservation par téléphone", "Sans rendez-vous"],
  },
  {
    title: "Places assises",
    items: ["Sièges extérieurs couverts", "Sièges extérieurs non couverts", "Sièges au bar", "Banquettes"],
  },
  {
    title: "Services",
    items: ["Offre la livraison", "Offre le traiteur", "Service de traiteur privé"],
  },
  {
    title: "Autre",
    items: ["Animaux acceptés", "BYOB", "TV disponible", "Bonne pour les groupes", "Offre des pourboires"],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditAmenitiesModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set(business.amenities || []));

  const toggle = (item: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("businesses")
      .update({ amenities: Array.from(selected) })
      .eq("id", business.id);

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Commodités et plus</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Choisissez les commodités que vous offrez à vos clients. Elles s'afficheront sur votre page QMAPS.
        </p>

        <div className="space-y-6">
          {AMENITY_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="font-heading font-bold text-foreground mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div key={item} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">{item}</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { if (!selected.has(item)) toggle(item); }}
                        className={`text-xs px-2 py-0.5 rounded ${selected.has(item) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => { if (selected.has(item)) toggle(item); }}
                        className={`text-xs px-2 py-0.5 rounded ${!selected.has(item) ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end mt-4 sticky bottom-0 bg-background pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAmenitiesModal;
