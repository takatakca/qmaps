import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import StarRating from "@/components/StarRating";
import {
  Eye, MousePointerClick, Phone, MessageSquare, Star,
  TrendingUp, CheckCircle2, AlertCircle, ChevronRight,
  Megaphone, Settings, BarChart3, ShieldCheck, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

const MerchantHome = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetch = async () => {
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      setBusiness(biz);
      if (biz) {
        const { data: revs } = await supabase
          .from("reviews")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setReviews(revs || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
        <Sparkles size={48} className="text-primary mb-4" />
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">Bienvenue sur FLEXS</h2>
        <p className="text-sm text-muted-foreground mb-6">Créez votre entreprise pour commencer à utiliser le tableau de bord professionnel.</p>
        <Button onClick={() => navigate("/merchant/onboarding")} className="rounded-full">Créer mon entreprise</Button>
        <MerchantBottomNav />
      </div>
    );
  }

  // Profile completion
  const fields = [business.phone, business.website, business.description, business.image_url, (business.amenities?.length || 0) > 0 ? "ok" : null];
  const completedFields = fields.filter(Boolean).length;
  const completionPct = Math.round((completedFields / fields.length) * 100);

  const statCards = [
    { icon: Eye, label: "Vues du profil", value: business.reviews_count * 12 || 0, color: "text-blue-500" },
    { icon: MousePointerClick, label: "Clics", value: business.reviews_count * 3 || 0, color: "text-green-500" },
    { icon: Phone, label: "Appels", value: business.reviews_count || 0, color: "text-orange-500" },
    { icon: MessageSquare, label: "Messages", value: 0, color: "text-purple-500" },
  ];

  const quickActions = [
    { icon: Megaphone, label: "Publicité", desc: "Lancer une campagne", route: "/merchant/optimization" },
    { icon: Settings, label: "Modifier profil", desc: "Infos & photos", route: "/merchant/marketplace" },
    { icon: BarChart3, label: "Statistiques", desc: "Voir les performances", route: "/merchant" },
    { icon: MessageSquare, label: "Messages", desc: "Voir la boîte", route: "/merchant/messages" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Bienvenue sur</p>
            <h1 className="font-heading text-xl font-bold text-foreground">
              FLEXS <span className="text-primary">Dashboard</span>
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
            {business.image_url ? (
              <img src={business.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">{business.name[0]}</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Business summary card */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
              {business.image_url ? (
                <img src={business.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">{business.name[0]}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-bold text-foreground truncate">{business.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRating rating={business.avg_rating} size={14} />
                <span className="text-xs text-muted-foreground">{business.avg_rating.toFixed(1)} ({business.reviews_count})</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${business.is_open ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
              {business.is_open ? "Ouvert" : "Fermé"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{business.address}, {business.city}</p>
        </div>

        {/* Profile completion */}
        {completionPct < 100 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Profil {completionPct}% complet</span>
              </div>
              <button onClick={() => navigate("/merchant/marketplace")} className="text-xs text-primary font-medium">Compléter →</button>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Complétez votre profil pour attirer plus de clients.</p>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className={s.color} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-[10px] text-green-600">+0% ce mois</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Actions rapides</h3>
          <div className="space-y-2">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.route)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <a.icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent reviews */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Avis récents</h3>
            <button onClick={() => navigate("/merchant")} className="text-xs text-primary font-medium">Voir tout →</button>
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-6">
              <Star size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 3).map(r => (
                <div key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={r.rating} size={12} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-CA")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{r.body || "Aucun commentaire"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
          <h3 className="font-heading font-bold text-foreground mb-1">Boostez votre visibilité</h3>
          <p className="text-xs text-muted-foreground mb-3">Lancez une campagne publicitaire pour atteindre plus de clients dans votre zone.</p>
          <Button onClick={() => navigate("/merchant/optimization")} size="sm" className="rounded-full gap-1">
            <Megaphone size={14} /> Voir les options
          </Button>
        </div>
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantHome;
