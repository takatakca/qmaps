import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";

interface ReviewWithBusiness {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  businesses: { id: string; name: string; image_url: string | null } | null;
}

const MyReviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reviews")
      .select("id, rating, body, created_at, businesses(id, name, image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews((data as any) || []);
        setLoading(false);
      });
  }, [user]);

  const timeAgo = (date: string) => {
    const months = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return "Récemment";
    if (months === 1) return "1 mois";
    if (months < 12) return `${months} mois`;
    const years = Math.floor(months / 12);
    return years === 1 ? "1 an" : `${years} ans`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Avis</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Chargement...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <Star size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Aucun avis</h2>
          <p className="text-sm text-muted-foreground">Vos avis apparaîtront ici.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {reviews.map(r => (
            <button
              key={r.id}
              onClick={() => r.businesses && navigate(`/business/${r.businesses.id}`)}
              className="w-full flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
            >
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 pt-0.5">
                <Star size={14} className="text-muted-foreground" />
                <span>Mon avis</span>
              </div>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{timeAgo(r.created_at)}</span>
            </button>
          ))}
          {reviews.map(r => r.businesses && (
            <button
              key={r.id}
              onClick={() => navigate(`/business/${r.businesses!.id}`)}
              className="w-full flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
            >
              {r.businesses.image_url ? (
                <img src={r.businesses.image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon size={24} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{r.businesses.name}</p>
                <StarRating rating={r.rating} size={16} />
                {r.body && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.body}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MyReviews;
