import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import ShareSheet from "@/components/ShareSheet";
import {
  User, Star, MapPin, Settings, LogOut, LogIn, Store, Camera, Award, Bell,
  Share2, QrCode, ChevronRight, MessageCircle, Heart, Activity, Eye,
  HelpCircle, Shield, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; email: string | null } | null>(null);
  const [stats, setStats] = useState({ reviews: 0, bookmarks: 0, photos: 0 });
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [impactTab, setImpactTab] = useState<"reviews" | "photos">("reviews");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, email").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setStats(s => ({ ...s, reviews: count || 0 })));
    supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setStats(s => ({ ...s, bookmarks: count || 0 })));
    // Load recently viewed (using bookmarks as proxy)
    supabase.from("bookmarks").select("*, businesses(*)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => setRecentlyViewed((data as any) || []));
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-8 space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-around">
          {[1,2,3,4].map(i => <Skeleton key={i} className="w-16 h-16 rounded-xl" />)}
        </div>
      </div>
      <BottomNav />
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
        <div className="px-4 pt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-muted-foreground" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Connectez-vous</h1>
          <p className="text-sm text-muted-foreground mb-6">Accédez à vos avis, collections et plus</p>
          <Button onClick={() => navigate("/auth")} className="rounded-full gap-2"><LogIn size={16} /> Se connecter</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const displayName = profile?.display_name || "Utilisateur";

  const actionButtons = [
    { icon: Star, label: "Ajouter\nun avis", action: () => navigate("/add-review") },
    { icon: Camera, label: "Ajouter\nune photo", action: () => navigate("/add-photo") },
    { icon: Award, label: "Check-in", action: () => {} },
    { icon: Store, label: "Ajouter\ncommerce", action: () => navigate("/add-business") },
  ];

  const contributionItems = [
    { label: "Avis", count: stats.reviews, icon: Star, path: "/my-reviews" },
    { label: "Commerces ajoutés", count: 0, icon: Store, path: "/added-businesses" },
  ];

  const communityItems = [
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Heart, label: "Compliments", path: "/compliments" },
    { icon: MapPin, label: "Événements", path: "/events" },
    { icon: Activity, label: "Fil d'activité", badge: 2, path: "/activity" },
    { icon: MessageCircle, label: "Discussions", path: "/messages" },
  ];

  const accountItems = [
    { icon: Settings, label: "Préférences", path: "/preferences" },
    { icon: User, label: "Profil", path: "/edit-profile" },
    { icon: HelpCircle, label: "Support", path: "/support" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header actions */}
      <div className="flex items-center justify-end gap-3 px-4 pt-4">
        <button onClick={() => navigate("/notifications")} className="relative p-2">
          <Bell size={22} className="text-foreground" />
          <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
        </button>
        <button onClick={() => setShareOpen(true)} className="p-2"><Share2 size={22} className="text-foreground" /></button>
        <button onClick={() => navigate("/qr-code")} className="p-2"><QrCode size={22} className="text-foreground" /></button>
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center px-4 pb-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-muted-foreground">{displayName.charAt(0).toUpperCase()}</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Montréal, QC, Canada</p>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User size={12} /> 0</span>
          <span className="flex items-center gap-1"><Star size={12} /> {stats.reviews}</span>
          <span className="flex items-center gap-1"><ImageIcon size={12} /> {stats.photos}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-around px-6 pb-4">
        {actionButtons.map(btn => (
          <button key={btn.label} onClick={btn.action} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center hover:bg-accent transition-colors">
              <btn.icon size={22} className="text-muted-foreground" />
            </div>
            <span className="text-[10px] text-foreground font-medium text-center whitespace-pre-line leading-tight">{btn.label}</span>
          </button>
        ))}
      </div>

      <div className="h-2 bg-muted" />

      {/* My Impact */}
      <div className="px-4 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Mon impact</h2>
        <div className="flex gap-2 mb-4 border-b border-border">
          {(["reviews", "photos"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setImpactTab(tab)}
              className={`pb-2 px-3 text-sm font-medium transition-colors ${impactTab === tab ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
            >
              {tab === "reviews" ? "Avis" : "Photos"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs text-muted-foreground">réactions totales</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.reviews}</p>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs text-muted-foreground">vues 90 derniers jours</p>
            <p className="text-2xl font-bold text-foreground mt-1">0</p>
          </div>
        </div>

        {/* Activity feed placeholder */}
        <div className="mt-4 text-center py-6">
          <p className="text-sm text-muted-foreground">Aucune activité récente</p>
          <p className="text-xs text-muted-foreground mt-1">Commencez à écrire des avis!</p>
        </div>
      </div>

      <div className="h-2 bg-muted" />

      {/* Recently viewed */}
      <div className="px-4 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Récemment consultés</h2>
        {recentlyViewed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun commerce consulté</p>
        ) : (
          <div className="space-y-3">
            {recentlyViewed.map(bk => bk.businesses && (
              <button
                key={bk.id}
                onClick={() => navigate(`/business/${bk.businesses.id}`)}
                className="w-full flex items-center justify-between p-2 hover:bg-accent/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={bk.businesses.image_url || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{bk.businesses.name}</p>
                    <p className="text-xs text-muted-foreground">{bk.businesses.address}</p>
                  </div>
                </div>
                <MapPin size={16} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-2 bg-muted" />

      {/* Contributions */}
      <div className="px-4 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Contributions</h2>
        {contributionItems.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)} className="w-full flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <item.icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-foreground">{item.count}</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="h-2 bg-muted" />

      {/* Community */}
      <div className="px-4 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Communauté</h2>
        {communityItems.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)} className="w-full flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <item.icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {"badge" in item && item.badge && (
                <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      <div className="h-2 bg-muted" />

      {/* Your activity */}
      <div className="px-4 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Votre activité</h2>
        <button onClick={() => navigate("/activity")} className="w-full flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Activité</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="h-2 bg-muted" />

      {/* Account */}
      <div className="px-4 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Compte</h2>
        {accountItems.map((item, i) => (
          <button key={`${item.label}-${i}`} className="w-full flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <item.icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="w-full flex items-center gap-3 py-2.5 mt-2"
        >
          <LogOut size={18} className="text-destructive" />
          <span className="text-sm font-medium text-destructive">Se déconnecter</span>
        </button>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Partager le profil"
        text={`Découvrez ${displayName} sur QMAPS!`}
        url={window.location.href}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
