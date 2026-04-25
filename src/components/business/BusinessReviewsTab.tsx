import { useState } from "react";
import { Star, Camera, Award, Info, X, ChevronDown, MoreVertical } from "lucide-react";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import ReviewReactionButtons from "@/components/social/ReviewReactionButtons";
import { useReviewReactions } from "@/hooks/useReviewReactions";
import ReportButton from "@/components/reports/ReportButton";

interface BusinessReviewsTabProps {
  businessId: string;
  reviews: (Tables<"reviews"> & { profiles?: { display_name: string | null } })[];
  avgRating: number;
  reviewsCount: number;
  userId: string | null;
  userName: string | null;
  onReviewSubmitted: () => void;
  onNavigateAuth: () => void;
}

const RatingDistribution = ({ reviews, avgRating, reviewsCount }: { reviews: any[]; avgRating: number; reviewsCount: number }) => {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  });
  const max = Math.max(...counts, 1);
  const barColors = ["bg-muted", "bg-[hsl(30,90%,55%)]", "bg-primary", "bg-primary", "bg-primary"];

  return (
    <div className="flex items-start gap-5">
      <div className="shrink-0">
        <p className="font-heading font-bold text-foreground text-sm">Note globale</p>
        <StarRating rating={avgRating} showValue />
        <p className="text-xs text-muted-foreground mt-0.5">{reviewsCount} avis</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-3 text-right">{star}</span>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColors[star - 1]}`}
                style={{ width: `${(counts[star - 1] / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BusinessReviewsTab = ({ businessId, reviews, avgRating, reviewsCount, userId, userName, onReviewSubmitted, onNavigateAuth }: BusinessReviewsTabProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showTrustBanner, setShowTrustBanner] = useState(true);
  const { byReview, pending, toggleReaction } = useReviewReactions(reviews.map((review) => review.id));

  const handleSubmit = async () => {
    if (!userId) { onNavigateAuth(); return; }
    if (rating === 0) { toast({ title: "Sélectionnez une note", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      business_id: businessId,
      user_id: userId,
      rating,
      body,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message.includes("uniq") ? "Vous avez déjà laissé un avis" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Avis publié!" });
      setRating(0);
      setBody("");
      onReviewSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Section title */}
      <h3 className="font-heading text-lg font-bold text-foreground">Avis recommandés</h3>

      {/* Trust banner */}
      {showTrustBanner && (
        <div className="flex gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 rounded-r-xl animate-fade-in">
          <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Votre confiance est notre priorité,</span> les commerces ne peuvent pas payer pour modifier ou supprimer leurs avis.{" "}
              <button className="text-primary font-medium">En savoir plus</button>.
            </p>
          </div>
          <button onClick={() => setShowTrustBanner(false)} className="shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Rating distribution */}
      <RatingDistribution reviews={reviews} avgRating={avgRating} reviewsCount={reviewsCount} />

      {/* Filters */}
      <button className="flex items-center gap-1 text-sm text-foreground font-medium">
        Voir {reviews.length > 0 ? reviews.length : ""} filtres <ChevronDown size={14} />
      </button>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Aucun avis pour le moment</p>
            <p className="text-muted-foreground text-xs mt-1">Soyez le premier à partager votre expérience!</p>
          </div>
        )}
        {reviews.map((review) => {
          const displayName = (review as any).profiles?.display_name || "Utilisateur";
          return (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              {/* User header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-semibold text-secondary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">0 avis • 0 photos</p>
                  </div>
                </div>
                <button><MoreVertical size={16} className="text-muted-foreground" /></button>
              </div>

              {/* Rating + date */}
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={review.rating} size={14} />
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("fr-CA")}
                </span>
              </div>

              {/* Body */}
              {review.body && (
                <p className="mt-2 text-sm text-foreground leading-relaxed">
                  {review.body.length > 200 ? (
                    <>
                      {review.body.slice(0, 200)}...{" "}
                      <button className="text-primary font-medium text-sm">Lire plus</button>
                    </>
                  ) : (
                    review.body
                  )}
                </p>
              )}

              {/* Reaction buttons */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <ReviewReactionButtons
                  reviewId={review.id}
                  counts={byReview[review.id]?.counts || { useful: review.useful, funny: review.funny, cool: review.cool }}
                  mine={byReview[review.id]?.mine || { useful: false, funny: false, cool: false }}
                  pending={pending}
                  onToggle={async (reviewId, reactionType) => {
                    if (!userId) {
                      onNavigateAuth();
                      return;
                    }
                    try {
                      await toggleReaction(reviewId, reactionType);
                    } catch (error) {
                      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer la réaction.", variant: "destructive" });
                    }
                  }}
                />
                <ReportButton targetType="review" targetId={review.id} iconOnly size="icon" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave a review card */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading text-lg font-bold text-foreground mb-4">Laisser un avis</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-semibold text-secondary-foreground">
              {(userName || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{userName || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground">0 avis • 0 photos</p>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => { if (!userId) onNavigateAuth(); else setRating(s); }} className="p-0.5">
              <Star size={28} className={s <= rating ? "fill-star text-star" : "text-muted-foreground/30"} />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <>
            <Textarea placeholder="Partagez votre expérience..." value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mb-3" />
            <Button onClick={handleSubmit} className="w-full rounded-full" disabled={submitting}>
              {submitting ? "Envoi..." : "Publier l'avis"}
            </Button>
          </>
        )}

        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-full">
            <Camera size={14} /> Ajouter photo
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-full">
            <Award size={14} /> Check in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessReviewsTab;
