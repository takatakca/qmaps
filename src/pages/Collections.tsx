import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Bookmark, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

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

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
        <div className="px-4 pt-6 text-center">
          <Bookmark size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Collections</h1>
          <p className="text-sm text-muted-foreground mb-6">Connectez-vous pour voir vos entreprises sauvegardées</p>
          <Button onClick={() => navigate("/auth")} className="rounded-full gap-2"><LogIn size={16} /> Se connecter</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Collections</h1>
        <p className="text-muted-foreground text-sm mt-1">Vos entreprises sauvegardées</p>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune entreprise sauvegardée</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {bookmarks.map(bk => bk.businesses && (
              <div
                key={bk.id}
                onClick={() => navigate(`/business/${bk.businesses!.id}`)}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer"
              >
                <img
                  src={bk.businesses.image_url || "/placeholder.svg"}
                  alt={bk.businesses.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground text-sm truncate">{bk.businesses.name}</h3>
                  <p className="text-xs text-muted-foreground">{bk.businesses.address}</p>
                  <p className="text-xs text-muted-foreground">⭐ {Number(bk.businesses.avg_rating).toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Collections;
