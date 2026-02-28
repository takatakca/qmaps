import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Clock, Share2, Bookmark, Star } from "lucide-react";
import StarRating from "@/components/StarRating";
import BottomNav from "@/components/BottomNav";
import { businesses, reviews } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const business = businesses.find((b) => b.id === id);

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Entreprise non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Hero Image */}
      <div className="relative">
        <img src={business.image} alt={business.name} className="w-full h-56 object-cover" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            <Share2 size={16} className="text-foreground" />
          </button>
          <button className="w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            <Bookmark size={16} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">{business.name}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <StarRating rating={business.rating} showValue />
          <span className="text-sm text-muted-foreground">
            ({business.reviewCount} avis)
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>{business.category}</span>
          <span>·</span>
          <span>{business.priceLevel}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{business.description}</p>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <Button size="sm" className="flex-1 gap-2 rounded-full">
            <Phone size={14} /> Appeler
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-2 rounded-full">
            <MapPin size={14} /> Itinéraire
          </Button>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{business.address}</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{business.phone}</span>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">{business.hours}</span>
              {business.isOpen && (
                <span className="text-xs font-medium text-success">Ouvert maintenant</span>
              )}
            </div>
          </div>
        </div>

        {/* Amenities */}
        {business.amenities.length > 0 && (
          <div className="mt-5">
            <h2 className="font-heading font-semibold text-foreground mb-2">Services</h2>
            <div className="flex flex-wrap gap-2">
              {business.amenities.map((a) => (
                <span key={a} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {business.photos.length > 0 && (
          <div className="mt-5">
            <h2 className="font-heading font-semibold text-foreground mb-2">Photos</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {business.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-32 h-32 rounded-lg object-cover shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-foreground">Avis récents</h2>
            <button className="text-xs text-primary font-medium">Voir tout</button>
          </div>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-xs font-semibold text-secondary-foreground">
                        {review.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={12} />
                </div>
                <p className="mt-2 text-sm text-foreground leading-relaxed">{review.text}</p>
                <div className="flex gap-4 mt-3">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    👍 Utile ({review.useful})
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    😄 Drôle ({review.funny})
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    😎 Cool ({review.cool})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review CTA */}
        <div className="mt-6 mb-4">
          <Button className="w-full rounded-full gap-2">
            <Star size={16} /> Écrire un avis
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BusinessDetail;
