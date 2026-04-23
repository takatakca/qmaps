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
      className="bg-card rounded-xl overflow-hidden shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <Bookmark size={16} className="text-foreground" />
        </button>
        {business.isOpen && (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-success text-success-foreground text-xs font-medium rounded-full">
            Ouvert
          </span>
        )}
      </div>
      <div className="p-3">
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
