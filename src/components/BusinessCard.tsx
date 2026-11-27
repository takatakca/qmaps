import DirectoryBookmark from "./business/DirectoryBookmark";
import BookmarkButton from "./business/BookmarkButton";
import { useQueryClient } from "@tanstack/react-query";
import { directoryAccountKey } from "@/hooks/useDirectoryAccount";
import { directoryPreferenceKey } from "@/hooks/useRecommendedBusinesses";
import { ownedApi } from "@/lib/ownedApi";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { getCategoryImage } from "@/lib/categoryImages";
import { exampleListingTitle } from "@/lib/exampleListing";
import type { Business } from "@/types";

interface BusinessCardProps {
  business: Business;
  ownedDirectory?: boolean;
}

const BusinessCard = ({ business, ownedDirectory = false }: BusinessCardProps) => {
  const cache = useQueryClient();
  function recordVisit() {
    const accountId = cache.getQueryData<string | null>(directoryAccountKey);
    if (!ownedDirectory || !accountId) return;
    void ownedApi("me/directory-preferences/" + business.id, "PUT", { action: "view", accountId })
      .then(() => cache.invalidateQueries({ queryKey: [...directoryPreferenceKey, accountId] }))
      .catch(() => { /* A recommendation signal must not interrupt navigation. */ });
  }
  const bookmarkClass = "absolute z-10 top-3 right-3 w-9 h-9 bg-card/95 rounded-full flex items-center justify-center shadow-soft";
  const exampleTitle = exampleListingTitle(business);
  const displayName = exampleTitle ?? business.name;
  const hasPhoto = Boolean(business.image) && business.image !== "/placeholder.svg";
  const image = hasPhoto ? business.image : getCategoryImage(business.category, displayName);

  return (
    <div
      className="group relative bg-card rounded-2xl overflow-hidden shadow-premium border border-border/70 cursor-pointer hover:shadow-premium-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={displayName}
          loading="lazy"
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {ownedDirectory ? <DirectoryBookmark id={business.id} className={bookmarkClass} /> :
          <BookmarkButton businessId={business.id} city={business.neighborhood} source="business_card" className={bookmarkClass} />}
        {business.isOpen && !exampleTitle && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-success text-success-foreground text-[11px] font-semibold rounded-full shadow-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-success-foreground/90" />
            Ouvert
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-heading font-semibold text-foreground"><Link className="after:absolute after:inset-0 focus-visible:underline" to={`/business/${business.id}`} onClick={recordVisit}>{displayName}</Link></h3>
        {exampleTitle && <span className="text-xs text-muted-foreground">Fiche d’exemple</span>}
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
