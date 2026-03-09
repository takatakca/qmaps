import { useState } from "react";
import { AlertCircle, X, ArrowRight, Star } from "lucide-react";
import StarRating from "@/components/StarRating";

interface Props {
  reviews: any[];
}

const MerchantReviews = ({ reviews }: Props) => {
  const [showPhotoBanner, setShowPhotoBanner] = useState(true);
  const recommendedReviews = reviews; // In production, filter by recommendation algorithm
  const notRecommendedCount = 0; // Placeholder

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-2xl font-bold text-foreground">Avis</h2>

      {/* Photo missing banner */}
      {showPhotoBanner && (
        <div className="flex gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Votre photo est manquante!</span> Pour répondre aux avis, vous devez{" "}
              <button className="text-primary font-medium underline">télécharger une photo de vous-même</button>.
            </p>
          </div>
          <button onClick={() => setShowPhotoBanner(false)} className="shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      )}

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
          {recommendedReviews.map((r: any) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {r.profiles?.display_name || "Utilisateur"}
                </p>
                <StarRating rating={r.rating} size={12} />
              </div>
              <p className="text-sm text-foreground mt-2">{r.body}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(r.created_at).toLocaleDateString("fr-CA")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantReviews;
