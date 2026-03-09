import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Bookmark, Plus, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import cafeImg from "@/assets/cafe-1.jpg";
import foodImg from "@/assets/food-1.jpg";
import restaurantImg from "@/assets/restaurant-1.jpg";

const featuredCollections = [
  { id: "f1", title: "Sélection hebdo Montréal", desc: "Les 10 meilleurs restaurants de Montréal cette semaine", image: foodImg, count: 10 },
  { id: "f2", title: "Incontournables Montréal", desc: "Découvrez les spots préférés des locaux", image: restaurantImg, count: 8 },
  { id: "f3", title: "Cafés cozy", desc: "Parfaits pour travailler ou relaxer", image: cafeImg, count: 6 },
];

const Collections = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<(Tables<"bookmarks"> & { businesses: Tables<"businesses"> | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    supabase
      .from("bookmarks")
      .select("*, businesses(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookmarks((data as any) || []);
        setLoading(false);
      });
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <h1 className="font-heading text-xl font-bold text-foreground">Collections</h1>
        {user && <button className="text-sm font-semibold text-primary">CRÉER</button>}
      </div>

      {/* Featured */}
      <div className="px-4 pt-4">
        <button className="flex items-center gap-1 text-sm text-foreground font-medium mb-3">
          En vedette à <span className="font-bold">Montréal</span> <ChevronDown size={14} />
        </button>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
          {featuredCollections.map(col => (
            <div key={col.id} className="min-w-[220px] flex-shrink-0">
              <div className="relative">
                <img src={col.image} alt={col.title} className="w-full h-36 rounded-xl object-cover" />
                <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                  <Bookmark size={12} className="fill-current" /> {col.count}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2">{col.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{col.desc}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Par QMAPS</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-2 bg-muted" />

      {/* My Collections */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Mes collections</h2>
          {bookmarks.length > 0 && <button className="text-sm font-semibold text-primary">Voir tout</button>}
        </div>

        {!user ? (
          <div className="text-center py-10">
            <Bookmark size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Connectez-vous pour voir vos collections</p>
            <Button onClick={() => navigate("/auth")} className="rounded-full gap-2"><LogIn size={16} /> Se connecter</Button>
          </div>
        ) : loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
            {/* Saved bookmarks */}
            {bookmarks.length > 0 && (
              <div className="min-w-[160px] flex-shrink-0">
                <div className="relative">
                  <img
                    src={bookmarks[0]?.businesses?.image_url || "/placeholder.svg"}
                    alt="Envies"
                    className="w-full h-36 rounded-xl object-cover"
                  />
                  <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Bookmark size={12} className="fill-current" /> {bookmarks.length}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-2">Envies</h3>
                <p className="text-xs text-muted-foreground">Privé</p>
              </div>
            )}

            {/* Create new */}
            <button className="min-w-[160px] flex-shrink-0 flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border">
              <Plus size={32} className="text-muted-foreground mb-1" />
              <span className="text-sm font-semibold text-foreground">Créer</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-2 bg-muted" />

      {/* Following Collections */}
      <div className="px-4 pt-4 pb-6">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Collections suivies</h2>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Vous ne suivez aucune collection.</p>
          <p className="text-xs text-muted-foreground mt-1">Découvrez les collections en vedette ci-dessus!</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Collections;
