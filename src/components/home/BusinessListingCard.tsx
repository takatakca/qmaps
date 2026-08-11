import { Link } from "react-router-dom";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import { getListingImage, getListingVisual } from "@/lib/listingVisuals";
import type { HomeListing } from "@/hooks/useHomeListings";

interface Props {
  business: HomeListing;
  variant?: "row" | "grid";
}

const priceLabels = ["$", "$$", "$$$", "$$$$"];

const BusinessListingCard = ({ business, variant = "row" }: Props) => {
  const image = getListingImage(business);
  const visual = getListingVisual(business.category_name, business.category_slug, business.name);
  const Icon = visual.icon;
  const rating = Number(business.avg_rating || 0);
  const isOpen = business.status === "open" && business.is_open;
  const price = business.price_level ? priceLabels[business.price_level - 1] : null;

  return (
    <Link
      to={`/business/${business.id}`}
      className={`group block shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        variant === "row" ? "w-[212px]" : "w-full"
      }`}
    >
      <div className="relative h-28 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={business.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${visual.gradient}`}>
            <Icon size={30} className={visual.iconClass} strokeWidth={1.75} />
          </div>
        )}
        <span
          className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-soft ${
            isOpen ? "bg-success text-success-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-success-foreground/90" : "bg-muted-foreground/60"}`} />
          {isOpen ? "Ouvert" : "Fermé"}
        </span>
        {business.is_claimed && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-soft backdrop-blur">
            <BadgeCheck size={11} /> Vérifié
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 font-heading text-[14px] font-bold text-foreground">{business.name}</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {rating > 0 ? (
            <>
              <Star size={11} className="fill-primary text-primary" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              <span>({business.reviews_count})</span>
            </>
          ) : (
            <span>Nouveau · aucun avis</span>
          )}
          {price && <span>· {price}</span>}
        </div>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {business.category_name ?? "Entreprise locale"}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin size={10} /> <span className="line-clamp-1">{business.city}</span>
        </p>
        <span className="mt-1 inline-block text-[11px] font-semibold text-primary group-hover:underline">
          Voir la fiche
        </span>
      </div>
    </Link>
  );
};

export default BusinessListingCard;
