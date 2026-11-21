import EndorseBusiness from "./EndorseBusiness";
import { Star, ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackBusinessEvent } from "@/lib/analytics";

interface BusinessActionsProps {
  businessId?: string;
  priceLevel: number | null;
  categoryName: string;
  isOpen: boolean;
  hours: string | null;
  website: string | null;
  phone: string | null;
  onWriteReview: () => void;
  onViewHours?: () => void;
}

const priceLabels = ["$", "$$", "$$$", "$$$$"];

const BusinessActions = ({ businessId, priceLevel, categoryName, isOpen, hours, website, phone, onWriteReview, onViewHours }: BusinessActionsProps) => {
  const handleWebsite = () => {
    if (!website) return;
    if (businessId) trackBusinessEvent(businessId, "website_click", { source: "business_detail" });
    window.open(website, "_blank");
  };
  const handlePhone = () => {
    if (!phone) return;
    if (businessId) trackBusinessEvent(businessId, "phone_click", { source: "business_detail" });
    window.open(`tel:${phone}`);
  };
  return (
    <div className="px-4 pt-4">
      {/* Category + status */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-foreground font-medium">{priceLabels[(priceLevel || 1) - 1]}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-foreground">{categoryName || "Commerce"}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`text-sm font-medium ${isOpen ? "text-success" : "text-destructive"}`}>
          {isOpen ? "Ouvert" : "Fermé"}
        </span>
        {hours && (
          <>
            <span className="text-muted-foreground text-sm">•</span>
            <button
              type="button"
              onClick={onViewHours}
              className="text-sm text-primary font-medium"
            >
              Voir les horaires
            </button>
          </>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2 mt-4">
        <Button onClick={onWriteReview} className="flex-1 gap-2 rounded-full font-semibold">
          <Star size={16} /> Écrire un avis
        </Button>
        {website && (
          <Button
            variant="outline"
            className="gap-2 rounded-full"
            onClick={handleWebsite}
          >
            <ExternalLink size={14} /> Site web
          </Button>
        )}
        {phone && (
          <Button
            variant="outline"
            aria-label="Appeler le commerce"
            size="icon"
            className="rounded-full shrink-0"
            onClick={handlePhone}
          >
            <Phone size={14} />
          </Button>
        )}
      </div>

      {businessId && <EndorseBusiness businessId={businessId} />}
    </div>
  );
};

export default BusinessActions;
