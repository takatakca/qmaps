import { ArrowLeft, Share2, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ShareSheet from "@/components/ShareSheet";
import BookmarkButton from "./BookmarkButton";
import StarRating from "@/components/StarRating";

interface BusinessHeroProps {
  name: string;
  imageUrl: string;
  avgRating: number;
  reviewsCount: number;
  isClaimed: boolean;
  photosCount: number;
  businessId: string;
  city: string;
}

const BusinessHero = ({ name, imageUrl, avgRating, reviewsCount, isClaimed, photosCount, businessId, city }: BusinessHeroProps) => {
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);

  const shareUrl = new URL("/business/" + businessId, window.location.origin).href;
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    setSharing(true);
  };

  return (
    <div className="relative">
      <img src={imageUrl || "/placeholder.svg"} alt={name} className="w-full h-72 object-cover" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
        <button aria-label="Retour" onClick={() => navigate(-1)} className="w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <BookmarkButton businessId={businessId} city={city} source="business_detail" className="w-9 h-9 bg-card/80 rounded-full flex items-center justify-center" />
          <button aria-label="Partager la fiche" onClick={share} className="w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Share2 size={16} className="text-foreground" />
          </button>
          <a href="#report-business" aria-label="Signaler la fiche" className="w-9 h-9 bg-card/80 rounded-full flex items-center justify-center"><Flag size={16} /></a>
        </div>
      </div>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} title="Partager la fiche" text={name} url={shareUrl} />

      {/* Bottom overlay content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        {!isClaimed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-card/80 backdrop-blur-sm text-foreground text-xs font-medium rounded-full mb-2">
            ⚠ Non revendiqué
          </span>
        )}
        <h1 className="font-heading text-2xl font-bold text-white leading-tight">{name}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <StarRating rating={avgRating} showValue />
          <span className="text-sm text-white/80">({reviewsCount} avis)</span>
        </div>
        {photosCount > 0 && (
          <a href="#business-photos" className="mt-2 block w-full py-2 bg-card/20 backdrop-blur-sm border border-white/30 rounded-lg text-sm font-medium text-white text-center">
            Voir les {photosCount} photos
          </a>
        )}
      </div>
    </div>
  );
};

export default BusinessHero;
