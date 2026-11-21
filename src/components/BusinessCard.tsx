import BookmarkButton from "./business/BookmarkButton";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { getCategoryImage } from "@/lib/categoryImages";
import type { Business } from "@/types";

interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  const hasPhoto = Boolean(business.image) && business.image !== "/placeholder.svg";
  const image = hasPhoto ? business.image : getCategoryImage(business.category, business.name);

  return (
    <div
      className="group relative bg-card rounded-2xl overflow-hidden shadow-premium border border-border/70 cursor-pointer hover:shadow-premium-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={business.name}
          loading="lazy"
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute right-3 top-3 z-10">
          <BookmarkButton id={business.id} city={business.neighborhood} source="business_card" />
        </div>
        {business.isOpen && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-success text-success-foreground text-[11px] font-semibold rounded-full shadow-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-success-foreground/90" />
            Ouvert
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-heading font-semibold text-foreground"><Link to={`/business/${business.id}`} className="after:absolute after:inset-0 focus-visible:underline">{business.name}</Link></h3>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={business.rating} />
          <span className="text-xs text-muted-foreground">
            ({business.reviewCount} avis)
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{business.category}</span>
          {business.priceLevel && <><span>·</span><span>{business.priceLevel}</span></>}
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
