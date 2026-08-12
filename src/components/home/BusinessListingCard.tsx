import { Link } from "react-router-dom";
import { Star, MapPin, BadgeCheck, ArrowUpRight } from "lucide-react";
import { getListingImage } from "@/lib/listingVisuals";
import { getCategoryImage } from "@/lib/categoryImages";
import type { HomeListing } from "@/hooks/useHomeListings";

interface Props {
  business: HomeListing;
  variant?: "row" | "grid";
}

const priceLabels = ["$", "$$", "$$$", "$$$$"];

const BusinessListingCard = ({ business, variant = "row" }: Props) => {
  const uploaded = getListingImage(business);
  const image = uploaded ?? getCategoryImage(business.category_name, business.category_slug, business.name);
  const rating = Number(business.avg_rating || 0);
  const isOpen = business.status === "open" && business.is_open;
  const price = business.price_level ? priceLabels[business.price_level - 1] : null;

  return (
    <Link
      to={`/business/${business.id}`}
      className={`group relative block shrink-0 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-premium transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-premium-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        variant === "row" ? "w-[268px] sm:w-[292px]" : "w-full"
      }`}
    >
      <div className="relative h-40 overflow-hidden sm:h-44">
        <img
          src={image}
          alt={business.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,10,20,0.92)] via-[rgba(5,10,20,0.25)] to-transparent" />
        {!uploaded && (
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80 backdrop-blur-md">
            Visuel de catégorie
          </span>
        )}
        {business.is_claimed && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft backdrop-blur-md">
            <BadgeCheck size={11} /> Vérifié
          </span>
        )}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <h3 className="line-clamp-2 font-heading text-[16px] font-bold leading-tight text-white drop-shadow">
            {business.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md ${
              isOpen ? "bg-success/90 text-success-foreground" : "bg-white/15 text-white/80"
            }`}
          >
            {isOpen ? "Ouvert" : "Fermé"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 p-4">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {rating > 0 ? (
            <>
              <Star size={12} className="fill-primary text-primary" />
              <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
              <span>({business.reviews_count})</span>
            </>
          ) : (
            <span className="font-medium text-primary">Nouveau sur QMaps</span>
          )}
          {price && <span>· {price}</span>}
        </div>
        <p className="line-clamp-1 text-[12px] font-medium text-foreground/80">
          {business.category_name ?? "Entreprise locale"}
        </p>
        <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <MapPin size={11} /> <span className="line-clamp-1">{business.city}</span>
        </p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
          Voir la fiche
          <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
};

export default BusinessListingCard;
