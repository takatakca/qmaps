import { Clock, Globe, Phone, MapPin, ArrowRight, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessInfoTabProps {
  hours: string | null;
  isOpen: boolean;
  website: string | null;
  phone: string | null;
  address: string;
  city: string;
  region: string | null;
  postalCode: string | null;
  amenities: string[] | null;
  latitude: number;
  longitude: number;
}

const paymentMethods = [
  { name: "Carte de débit", supported: true },
  { name: "Apple Pay", supported: false },
  { name: "Carte de crédit", supported: true },
];

const features = [
  { name: "Décontracté", supported: true },
  { name: "Calme", supported: true },
  { name: "Bon pour les enfants", supported: true },
];

const ecoFeatures = [
  { name: "Stationnement vélo", supported: false },
];

const BusinessInfoTab = ({ hours, isOpen, website, phone, address, city, region, postalCode, amenities, latitude, longitude }: BusinessInfoTabProps) => {
  const fullAddress = `${address}\n${city}${region ? `, ${region}` : ""}${postalCode ? ` ${postalCode}` : ""}`;
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="space-y-0">
      <h3 className="font-heading text-lg font-bold text-foreground mb-4">Info</h3>

      {/* Hours */}
      <div className="flex items-center justify-between py-4 border-b border-border">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Horaires</p>
            <p className={`text-sm font-medium ${isOpen ? "text-success" : "text-destructive"}`}>
              {isOpen ? "Ouvert" : "Fermé"}
            </p>
          </div>
        </div>
        <ArrowRight size={18} className="text-muted-foreground" />
      </div>

      {/* Website */}
      {website && (
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex items-start gap-3">
            <Globe size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Site web</p>
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate block max-w-[220px]">
                {website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
          <Globe size={18} className="text-muted-foreground" />
        </div>
      )}

      {/* Phone */}
      {phone && (
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex items-start gap-3">
            <Phone size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Appeler</p>
              <a href={`tel:${phone}`} className="text-sm text-foreground">{phone}</a>
            </div>
          </div>
          <Phone size={18} className="text-muted-foreground" />
        </div>
      )}

      {/* Map */}
      <div className="mt-4 rounded-xl overflow-hidden border border-border">
        <iframe
          src={mapUrl}
          className="w-full h-40"
          loading="lazy"
          title="Carte"
          style={{ border: 0 }}
        />
      </div>

      {/* Address */}
      <div className="py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-foreground whitespace-pre-line">{fullAddress}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 ml-3">2.2 km</span>
        </div>
      </div>

      {/* Get directions */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="text-sm font-semibold text-foreground">Obtenir l'itinéraire</span>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={18} className="text-muted-foreground" />
        </a>
      </div>

      {/* Suggest edit */}
      <Button variant="outline" className="w-full rounded-full gap-2 mt-2">
        <Pencil size={14} /> Suggérer une modification
      </Button>

      {/* Payments */}
      <div className="mt-6">
        <h4 className="font-heading font-semibold text-foreground mb-3">Paiements</h4>
        <div className="space-y-2">
          {paymentMethods.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              {p.supported ? <Check size={16} className="text-foreground" /> : <X size={16} className="text-muted-foreground" />}
              <span className={`text-sm ${p.supported ? "text-foreground" : "text-muted-foreground"}`}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-5 border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading font-semibold text-foreground">Caractéristiques</h4>
          <ArrowRight size={18} className="text-muted-foreground" />
        </div>
        <div className="space-y-2">
          {features.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              <Check size={16} className="text-foreground" />
              <span className="text-sm text-foreground">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Eco */}
      <div className="mt-5 border-t border-border pt-5">
        <h4 className="font-heading font-semibold text-foreground mb-3">Éco-responsable</h4>
        <div className="space-y-2">
          {ecoFeatures.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              {f.supported ? <Check size={16} className="text-foreground" /> : <X size={16} className="text-muted-foreground" />}
              <span className={`text-sm ${f.supported ? "text-foreground" : "text-muted-foreground"}`}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community update */}
      <div className="mt-6 p-4 bg-secondary rounded-xl">
        <h4 className="font-heading font-semibold text-foreground mb-1">Mise à jour communauté</h4>
        <p className="text-sm font-medium text-foreground mb-3">Ont-ils le Wi-Fi?</p>
        <div className="flex flex-wrap gap-2">
          {["Gratuit", "Payant", "Aucun", "Pas sûr"].map((opt) => (
            <button key={opt} className="px-4 py-1.5 border border-border bg-card rounded-full text-sm font-medium text-foreground hover:bg-accent transition-colors">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoTab;
