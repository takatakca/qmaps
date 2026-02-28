import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Phone, MapPin, Clock, Share2, Bookmark, Star } from "lucide-react";
import StarRating from "@/components/StarRating";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const priceLabels = ["$", "$$", "$$$", "$$$$"];

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [reviews, setReviews] = useState<(Tables<"reviews"> & { profiles?: { display_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
      setBusiness(biz);

      const { data: revs } = await supabase
        .from("reviews")
        .select("*, profiles:user_id(display_name)")
        .eq("business_id", id)
        .order("created_at", { ascending: false });
      setReviews((revs as any) || []);

      if (user) {
        const { data: bk } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("business_id", id)
          .maybeSingle();
        setBookmarked(!!bk);
      }
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const handleBookmark = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!id) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("business_id", id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, business_id: id });
      setBookmarked(true);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!id) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      business_id: id,
      user_id: user.id,
      rating: reviewRating,
      body: reviewBody,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message.includes("uniq_review") ? "Vous avez déjà laissé un avis" : error.message, variant: "destructive" });
    } else {
      toast({ title: "Avis publié!" });
      setShowReviewForm(false);
      setReviewBody("");
      // Refresh
      const { data: revs } = await supabase.from("reviews").select("*, profiles:user_id(display_name)").eq("business_id", id).order("created_at", { ascending: false });
      setReviews((revs as any) || []);
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
      if (biz) setBusiness(biz);
    }
    setSubmitting(false);
  };

  if (loading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{loading ? "Chargement..." : "Entreprise non trouvée"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Hero Image */}
      <div className="relative">
        <img src={business.image_url || "/placeholder.svg"} alt={business.name} className="w-full h-56 object-cover" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            <Share2 size={16} className="text-foreground" />
          </button>
          <button onClick={handleBookmark} className="w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            <Bookmark size={16} className={bookmarked ? "text-primary fill-primary" : "text-foreground"} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">{business.name}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <StarRating rating={Number(business.avg_rating)} showValue />
          <span className="text-sm text-muted-foreground">({business.reviews_count} avis)</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>{priceLabels[(business.price_level || 1) - 1]}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{business.description}</p>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <Button size="sm" className="flex-1 gap-2 rounded-full"><Phone size={14} /> Appeler</Button>
          <Button size="sm" variant="outline" className="flex-1 gap-2 rounded-full"><MapPin size={14} /> Itinéraire</Button>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{business.address}</span>
          </div>
          {business.phone && (
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">{business.phone}</span>
            </div>
          )}
          {business.hours && (
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{business.hours}</span>
                {business.is_open && <span className="text-xs font-medium text-success">Ouvert maintenant</span>}
              </div>
            </div>
          )}
        </div>

        {/* Amenities */}
        {business.amenities && business.amenities.length > 0 && (
          <div className="mt-5">
            <h2 className="font-heading font-semibold text-foreground mb-2">Services</h2>
            <div className="flex flex-wrap gap-2">
              {business.amenities.map(a => (
                <span key={a} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-foreground">Avis ({reviews.length})</h2>
          </div>

          {showReviewForm ? (
            <div className="bg-card rounded-xl p-4 border border-border mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Votre note:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setReviewRating(s)}>
                      <Star size={20} className={s <= reviewRating ? "fill-star text-star" : "text-muted-foreground/30"} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea placeholder="Partagez votre expérience..." value={reviewBody} onChange={e => setReviewBody(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} size="sm" className="rounded-full" disabled={submitting}>
                  {submitting ? "Envoi..." : "Publier"}
                </Button>
                <Button onClick={() => setShowReviewForm(false)} size="sm" variant="outline" className="rounded-full">Annuler</Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {reviews.map(review => (
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
                <p className="mt-2 text-sm text-foreground leading-relaxed">{review.body}</p>
                <div className="flex gap-4 mt-3">
                  <button className="text-xs text-muted-foreground">👍 Utile ({review.useful})</button>
                  <button className="text-xs text-muted-foreground">😄 Drôle ({review.funny})</button>
                  <button className="text-xs text-muted-foreground">😎 Cool ({review.cool})</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review CTA */}
        <div className="mt-6 mb-4">
          <Button className="w-full rounded-full gap-2" onClick={() => { if (!user) navigate("/auth"); else setShowReviewForm(true); }}>
            <Star size={16} /> Écrire un avis
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BusinessDetail;
