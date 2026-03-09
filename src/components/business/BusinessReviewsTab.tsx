import { useState } from "react";
import { Star, Camera, Award } from "lucide-react";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface BusinessReviewsTabProps {
  businessId: string;
  reviews: (Tables<"reviews"> & { profiles?: { display_name: string | null } })[];
  userId: string | null;
  userName: string | null;
  onReviewSubmitted: () => void;
  onNavigateAuth: () => void;
}

const BusinessReviewsTab = ({ businessId, reviews, userId, userName, onReviewSubmitted, onNavigateAuth }: BusinessReviewsTabProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        
        {/* Star selection */}
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => { if (!userId) onNavigateAuth(); else setRating(s); }} className="p-0.5">
              <Star
                size={28}
                className={s <= rating ? "fill-star text-star" : "text-muted-foreground/30"}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <>
            <Textarea
              placeholder="Partagez votre expérience..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <Button onClick={handleSubmit} className="w-full rounded-full" disabled={submitting}>
              {submitting ? "Envoi..." : "Publier l'avis"}
            </Button>
          </>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-full">
            <Camera size={14} /> Ajouter photo
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-full">
            <Award size={14} /> Check in
          </Button>
        </div>
      </div>

      {/* Existing reviews */}
      <div className="space-y-3">
        {reviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Aucun avis pour le moment</p>
            <p className="text-muted-foreground text-xs mt-1">Soyez le premier à partager votre expérience!</p>
          </div>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    {((review as any).profiles?.display_name || "U").charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{(review as any).profiles?.display_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("fr-CA")}</p>
                </div>
              </div>
              <StarRating rating={review.rating} size={12} />
            </div>
            {review.body && (
              <p className="mt-2 text-sm text-foreground leading-relaxed">{review.body}</p>
            )}
            <div className="flex gap-4 mt-3">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">👍 Utile ({review.useful})</button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">😄 Drôle ({review.funny})</button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">😎 Cool ({review.cool})</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessReviewsTab;
