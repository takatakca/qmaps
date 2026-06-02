import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StarRating from "./StarRating";
import type { Business } from "@/types";

interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/business/${business.id}`)}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft border border-border cursor-pointer hover:shadow-elevated hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative overflow-hidden">
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label="Enregistrer"
          className="absolute top-3 right-3 w-9 h-9 bg-card/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft hover:shadow-glow hover:text-primary transition-all"
        >
          <Bookmark size={16} className="text-foreground" />
        </button>
        {business.isOpen && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-success text-success-foreground text-[11px] font-semibold rounded-full shadow-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-success-foreground/90" />
            Ouvert
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-heading font-semibold text-foreground">{business.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={business.rating} />
          <span className="text-xs text-muted-foreground">
            ({business.reviewCount} avis)
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{business.category}</span>
          <span>·</span>
          <span>{business.priceLevel}</span>
          <span>·</span>
          <span>{business.neighborhood}</span>
          {business.distance && (
            <>
              <span>·</span>
              <span>{business.distance}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
