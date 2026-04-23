import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Star, ImageIcon, Bookmark, ThumbsUp, Smile, Heart as HeartIcon, Frown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "@/components/StarRating";
import BottomNav from "@/components/BottomNav";
import ReviewReactionButtons from "@/components/social/ReviewReactionButtons";
import { useReviewReactions } from "@/hooks/useReviewReactions";
import { useToast } from "@/hooks/use-toast";

const MyActivity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ reviews: 0, photos: 0 });
  const { byReview, pending, toggleReaction } = useReviewReactions(reviews.map((review) => review.id));

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("reviews").select("*, businesses(id, name, image_url, avg_rating, reviews_count, city)")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews((data as any) || []);
        setStats(s => ({ ...s, reviews: data?.length || 0 }));
      });
  }, [user]);

  const displayName = profile?.display_name || "Utilisateur";

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Mon activité</h1>
      </div>

      {/* User header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <User size={24} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{displayName}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User size={10} /> 0</span>
            <span className="flex items-center gap-1"><Star size={10} /> {stats.reviews}</span>
            <span className="flex items-center gap-1"><ImageIcon size={10} /> {stats.photos}</span>
          </div>
        </div>
      </div>

      {/* Reviews activity */}
      {reviews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-muted-foreground">Aucune activité récente</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {reviews.map(r => (
            <div key={r.id} className="px-4 py-4">
              <p className="text-xs text-muted-foreground mb-2">A écrit un avis</p>

              {r.businesses && (
                <button
                  onClick={() => navigate(`/business/${r.businesses.id}`)}
                  className="w-full flex items-start gap-3 p-3 bg-card border border-border rounded-xl mb-3"
                >
                  {r.businesses.image_url ? (
                    <img src={r.businesses.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{r.businesses.name}</p>
                      <Bookmark size={18} className="text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={Number(r.businesses.avg_rating)} size={12} />
                      <span className="text-xs text-muted-foreground">{r.businesses.reviews_count} avis</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.businesses.city}</p>
                  </div>
                </button>
              )}

              <StarRating rating={r.rating} size={18} />
              {r.body && <p className="text-sm text-foreground mt-2 line-clamp-3">{r.body}</p>}

              <div className="mt-3">
                <ReviewReactionButtons
                  compact
                  reviewId={r.id}
                  counts={byReview[r.id]?.counts || { useful: r.useful, funny: r.funny, cool: r.cool }}
                  mine={byReview[r.id]?.mine || { useful: false, funny: false, cool: false }}
                  pending={pending}
                  onToggle={async (reviewId, reactionType) => {
                    try {
                      await toggleReaction(reviewId, reactionType);
                    } catch (error) {
                      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer la réaction.", variant: "destructive" });
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MyActivity;
