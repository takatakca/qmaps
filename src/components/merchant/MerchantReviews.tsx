import { useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/StarRating";
import type { ReviewWithAuthor } from "@/lib/reviewsWithAuthors";

interface Props {
  reviews: ReviewWithAuthor[];
  onReplySaved?: () => void;
}

const MerchantReviews = ({ reviews, onReplySaved }: Props) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedReplies, setSavedReplies] = useState<Record<string, string>>({});

  const saveReply = async (reviewId: string) => {
    const body = replyDraft.trim().replace(/\s+/g, " ");
    if (!body || body.length > 2000) {
      toast({ title: "Réponse invalide", description: "Écrivez une réponse de 1 à 2000 caractères.", variant: "destructive" });
      return;
    }

    setSavingId(reviewId);
    try {
      const { data, error } = await supabase.functions.invoke("merchant-reply-review", {
        body: { reviewId, body },
      });
      if (error || data?.ok !== true) throw new Error(error?.message || "Enregistrement impossible.");
      setSavedReplies((current) => ({ ...current, [reviewId]: body }));
      setEditingId(null);
      setReplyDraft("");
      toast({ title: "Réponse publiée" });
      onReplySaved?.();
    } catch (error) {
      toast({
        title: "Impossible d'enregistrer la réponse",
        description: error instanceof Error ? error.message : "Réessayez après la configuration du service.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-2xl font-bold text-foreground">Avis</h2>

      <p className="text-sm text-muted-foreground">
        Consultez les avis disponibles pour votre commerce et répondez-y publiquement.
      </p>

      {/* Empty state */}
      {reviews.length === 0 ? (
        <div className="space-y-6">
          {/* Illustration placeholder */}
          <div className="flex justify-center py-6">
            <div className="w-64 h-40 bg-muted rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={24} className={i <= 3 ? "fill-star text-star" : "text-muted-foreground/30"} />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">Pas encore d'avis</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-heading text-lg font-bold text-foreground">Aucun avis disponible pour le moment</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Les avis apparaîtront ici lorsqu'ils seront disponibles pour votre entreprise.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Préparer votre fiche QMAPS
            </h3>
            <p className="text-sm text-muted-foreground">
              Vérifiez vos coordonnées, vos horaires et les photos de votre commerce pour aider les visiteurs à le découvrir.
            </p>
            <Link
              to="/merchant/business-info"
              className="inline-flex items-center text-sm text-primary font-medium hover:underline"
            >
              Compléter les informations de mon commerce
            </Link>
          </div>
        </div>
      ) : (
        /* Review list */
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {review.profiles?.display_name || "Utilisateur"}
                </p>
                <StarRating rating={review.rating} size={12} />
              </div>
              {review.body ? (
                <p className="text-sm text-foreground mt-2">{review.body}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Note attribuée sans commentaire.</p>
              )}
              {(savedReplies[review.id] || review.owner_reply) && (
                <p className="text-sm text-foreground mt-2">
                  <span className="font-medium">Réponse de l'entreprise. </span>
                  {savedReplies[review.id] || review.owner_reply}
                </p>
              )}

              {editingId === review.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    aria-label={`Réponse au commentaire de ${review.profiles?.display_name || "Utilisateur"}`}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    maxLength={2000}
                    placeholder="Merci pour votre avis..."
                    rows={3}
                    disabled={savingId === review.id}
                  />
                  <p className="text-xs text-muted-foreground">{replyDraft.length}/2000 caractères</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void saveReply(review.id)}
                      disabled={savingId === review.id || !replyDraft.trim()}
                    >
                      {savingId === review.id ? "Enregistrement..." : "Publier la réponse"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingId(null); setReplyDraft(""); }}
                      disabled={savingId === review.id}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(review.id);
                    setReplyDraft(savedReplies[review.id] || review.owner_reply || "");
                  }}
                >
                  {savedReplies[review.id] || review.owner_reply ? "Modifier votre réponse" : "Répondre à cet avis"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(review.created_at).toLocaleDateString("fr-CA")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantReviews;
