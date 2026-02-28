import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { User, Star, MapPin, Settings, LogOut, LogIn, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; email: string | null } | null>(null);
  const [stats, setStats] = useState({ reviews: 0, bookmarks: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, email").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setStats(s => ({ ...s, reviews: count || 0 })));
    supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setStats(s => ({ ...s, bookmarks: count || 0 })));
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
        <div className="px-4 pt-6 text-center">
          <User size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Connectez-vous</h1>
          <p className="text-sm text-muted-foreground mb-6">Accédez à vos avis, collections et plus</p>
          <Button onClick={() => navigate("/auth")} className="rounded-full gap-2"><LogIn size={16} /> Se connecter</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">{(profile?.display_name || "U").charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{profile?.display_name || "Utilisateur"}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Star size={20} className="mx-auto text-star mb-1" />
            <p className="text-lg font-bold text-foreground">{stats.reviews}</p>
            <p className="text-xs text-muted-foreground">Avis</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <MapPin size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{stats.bookmarks}</p>
            <p className="text-xs text-muted-foreground">Sauvegardés</p>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => navigate("/merchant")} className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
            <Store size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Tableau de bord marchand</span>
          </button>
          <button onClick={() => navigate("/collections")} className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
            <Settings size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Mes collections</span>
          </button>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
          >
            <LogOut size={18} className="text-destructive" />
            <span className="text-sm font-medium text-destructive">Se déconnecter</span>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
