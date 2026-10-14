import { useState } from "react";
import { ArrowRight, Star } from "lucide-react";
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
  const recommendedReviews = reviews;
  const notRecommendedCount = 0;

  const saveReply = async (reviewId: string) => {
    const body = replyDraft.trim().replace(/\\s+/g, " ");
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
        Répondez aux commentaires de vos clients. Votre réponse apparaît sur la fiche publique.
      </p>

      {/* Empty state */}
      {recommendedReviews.length === 0 ? (
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
            <h3 className="font-heading text-lg font-bold text-foreground">Aucun avis recommandé pour l'instant</h3>
            {notRecommendedCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Pour l'instant, vous avez <button className="text-primary font-medium">{notRecommendedCount} avis</button> non recommandés.{" "}
                <button className="text-primary font-medium">En savoir plus</button>.
              </p>
            )}
          </div>

          {/* Tips card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Comment obtenir des avis QMAPS pour votre entreprise
            </h3>

            <div>
              <button className="text-primary font-medium text-sm flex items-center gap-1">
                Terminez la configuration de votre page <ArrowRight size={14} />
              </button>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez les informations de votre entreprise, téléchargez des photos et bien plus gratuitement.
              </p>
            </div>

            <div>
              <button className="text-primary font-medium text-sm flex items-center gap-1">
                Misez sur le service client et le marketing <ArrowRight size={14} />
              </button>
              <p className="text-sm text-muted-foreground mt-1">
                Offrez une excellente expérience client, incluez la marque QMAPS dans votre marketing et créez des espaces dignes de partage pour inspirer les téléchargements de photos sur QMAPS.
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-foreground">Rappel : Ne demandez pas d'avis</p>
              <p className="text-sm text-muted-foreground mt-1">
                Le logiciel de recommandation automatisé de QMAPS est conçu pour placer les avis sollicités dans la section « non recommandés » d'une page d'entreprise, aidant à uniformiser les règles pour toutes les entreprises sur QMAPS.
              </p>
            </div>

            <div className="space-y-1">
              <button className="text-primary font-medium text-sm flex items-center gap-1">
                En savoir plus sur le logiciel de recommandation <ArrowRight size={14} />
              </button>
              <button className="text-primary font-medium text-sm flex items-center gap-1">
                Pourquoi certains avis ne sont pas recommandés <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Review list */
        <div className="space-y-3">
          {recommendedReviews.map((review) => (
            <div key={review.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {review.profiles?.display_name || "Utilisateur"}
                </p>
                <StarRating rating={review.rating} size={12} />
              </div>
              <p className="text-sm text-foreground mt-2">{review.body}</p>
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
