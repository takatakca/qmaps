import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import StarRating from "@/components/StarRating";
import {
  Settings, Star, Camera, ChevronRight, ChevronDown, Lock,
  Sparkles, Link2, PhoneCall, Award, Image, Play, ShieldOff,
  Package, Users, MapPin, CreditCard, Bell, ShieldCheck, User,
  CalendarClock, Scale, FileText, HelpCircle, LogOut, Briefcase, Inbox
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/integrations/supabase/types";

const MerchantMore = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: biz }, { data: prof }] = await Promise.all([
        supabase.from("businesses").select("*").eq("owner_user_id", user.id).limit(1).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setBusiness(biz);
      setProfile(prof);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
        <MerchantBottomNav />
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading text-lg font-bold text-foreground">Menu</h1>
        <button onClick={() => navigate("/merchant/business-info")}>
          <Settings size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Business card */}
      {business && (
        <button
          onClick={() => navigate("/merchant/business-info")}
          className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        >
          <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
            {business.image_url ? (
              <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-bold">
                {business.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-heading font-bold text-foreground text-sm">{business.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <StarRating rating={business.avg_rating} size={12} />
              <span className="text-xs text-muted-foreground">{business.avg_rating.toFixed(1)} ({business.reviews_count} avis)</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{business.address}, {business.city}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>
      )}

      {/* Location dropdown */}
      {business && (
        <button className="w-full px-4 py-3 flex items-center justify-between border-y border-border hover:bg-muted/30 transition-colors">
          <span className="text-sm text-foreground">{business.address}, {business.city}</span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </button>
      )}

      <div className="px-4 pt-5 space-y-5">
        {/* YOUR BUSINESS */}
        <Section title="Votre entreprise">
          <MenuItem icon={Inbox} label="Demandes de projet" badge="Nouveau" onClick={() => navigate("/merchant/leads")} />
          <MenuItem icon={Briefcase} label="Mes services" onClick={() => navigate("/merchant/services")} />
          <MenuItem icon={Users} label="QMAPS Host" badge="Nouveau" onClick={() => navigate("/merchant/host")} />
          <MenuItem icon={Star} label="Avis" onClick={() => navigate("/merchant/reviews")} />
          <MenuItem icon={Camera} label="Photos & Vidéos" onClick={() => navigate("/merchant/photos")} />
        </Section>

        <Separator />

        {/* ENHANCE YOUR PAGE */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-2 py-0.5">Upgrade</Badge>
          </div>
          <h3 className="font-heading font-bold text-foreground text-base mb-1">Améliorez votre page</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Ces fonctionnalités peuvent améliorer votre page QMAPS et augmenter l'attrait de votre entreprise.
          </p>

          {/* Upgrade card */}
          <div className="bg-muted/50 rounded-xl p-4 mb-4 relative">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Accédez aux fonctionnalités avancées avec le Forfait Amélioré.
                </p>
                <button onClick={() => navigate("/merchant/upgrade")} className="text-primary text-sm font-semibold mt-2">
                  Grouper & Économiser
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            <MenuItem icon={Link2} label="QMAPS Connect" onClick={() => navigate("/merchant/connect")} />
            <MenuItem icon={PhoneCall} label="Appel à l'action" onClick={() => navigate("/merchant/cta")} />
            <MenuItem icon={Award} label="Points forts de l'entreprise" onClick={() => navigate("/merchant/highlights")} />
            <MenuItem icon={Image} label="Logo" onClick={() => navigate("/merchant/photos")} />
            <MenuItem icon={Play} label="Diaporama" locked onClick={() => navigate("/merchant/upgrade")} />
            <MenuItem icon={ShieldOff} label="Supprimer les pubs concurrentes" locked onClick={() => navigate("/merchant/upgrade")} />
            <MenuItem icon={Package} label="Grouper & Économiser" arrow onClick={() => navigate("/merchant/upgrade")} />
          </div>
        </div>

        <Separator />

        {/* PROMOTE */}
        <Section title="Promouvoir">
          <MenuItem icon={Users} label="QMAPS Guest Manager" onClick={() => navigate("/merchant/guest-manager")} />
        </Section>

        <Separator />

        {/* APP INFO */}
        <Section title="Infos de l'application">
          <MenuItem icon={MapPin} label="Ajouter des emplacements" onClick={() => navigate("/merchant/business-info")} />
          <MenuItem icon={CreditCard} label="Facturation" onClick={() => navigate("/merchant/billing")} />
          <MenuItem icon={Bell} label="Paramètres de notification" onClick={() => navigate("/merchant/notifications")} />
          <MenuItem icon={ShieldCheck} label="Paramètres de sécurité" onClick={() => navigate("/merchant/business-info")} />
          <MenuItem icon={User} label="Informations du compte" onClick={() => navigate("/merchant/business-info")} />
          <MenuItem icon={CalendarClock} label="Outils de planification" badge="Nouveau" onClick={() => navigate("/merchant/business-info")} />
          <MenuItem icon={Scale} label="Légal & Confidentialité" onClick={() => navigate("/merchant/business-info")} />
          <MenuItem icon={FileText} label="Conditions d'utilisation" onClick={() => navigate("/merchant/business-info")} />
          <MenuItem icon={HelpCircle} label="Contacter le support" onClick={() => navigate("/merchant/business-info")} />
        </Section>

        <Separator />

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-3 text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Se déconnecter ({displayName})</span>
        </button>

        {/* FOOTER */}
        <p className="text-center text-xs text-muted-foreground pb-4 pt-2">
          Copyright © {new Date().getFullYear()} QMAPS
        </p>
      </div>

      <MerchantBottomNav />
    </div>
  );
};

/* Reusable sub-components */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="font-heading font-bold text-foreground text-base mb-2">{title}</h3>
    <div className="space-y-0">{children}</div>
  </div>
);

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string;
  locked?: boolean;
  arrow?: boolean;
  onClick: () => void;
}

const MenuItem = ({ icon: Icon, label, badge, locked, arrow, onClick }: MenuItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors"
  >
    <Icon size={18} className="text-muted-foreground shrink-0" />
    <span className="flex-1 text-left text-sm text-foreground">{label}</span>
    {badge && (
      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-2 py-0.5">{badge}</Badge>
    )}
    {locked && <Lock size={14} className="text-muted-foreground" />}
    {arrow && <ChevronRight size={16} className="text-muted-foreground" />}
  </button>
);

export default MerchantMore;
