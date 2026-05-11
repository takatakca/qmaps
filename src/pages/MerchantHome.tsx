import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import HomeHeader from "@/components/merchant/home/HomeHeader";
import RemindersSection from "@/components/merchant/home/RemindersSection";
import AdPreviewSection from "@/components/merchant/home/AdPreviewSection";
import PerformanceSection from "@/components/merchant/home/PerformanceSection";
import ActivitySection from "@/components/merchant/home/ActivitySection";
import UpgradePromoSection from "@/components/merchant/home/UpgradePromoSection";
import QuickQuestionSection from "@/components/merchant/home/QuickQuestionSection";
import InsightsSection from "@/components/merchant/home/InsightsSection";
import CompetitorSection from "@/components/merchant/home/CompetitorSection";
import EnhanceSection from "@/components/merchant/home/EnhanceSection";
import CompletenessCard from "@/components/merchant/CompletenessCard";
import type { MenuItem } from "@/lib/menuItems";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

const MerchantHome = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [displayName, setDisplayName] = useState("Professionnel");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchData = async () => {
      const [{ data: biz }, { data: profile }] = await Promise.all([
        supabase.from("businesses").select("*").eq("owner_user_id", user.id).limit(1).maybeSingle(),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      ]);
      setBusiness(biz);
      setDisplayName(profile?.display_name || user.email?.split("@")[0] || "Professionnel");
      if (biz) {
        const { data: menu } = await (supabase as any)
          .from("business_menu_items")
          .select("*")
          .eq("business_id", biz.id);
        setMenuItems((menu as MenuItem[]) ?? []);
      }
      setLoading(false);
    };
    fetchData();
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
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">Bienvenue sur QMAPS</h2>
        <p className="text-sm text-muted-foreground mb-6">Créez votre entreprise pour commencer à utiliser le tableau de bord professionnel.</p>
        <Button onClick={() => navigate("/merchant/onboarding")} className="rounded-full">Créer mon entreprise</Button>
        <MerchantBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <HomeHeader business={business} displayName={displayName} />

      <div className="p-4 space-y-4">
        <CompletenessCard business={business as any} menuItems={menuItems} />
        <RemindersSection />
        <AdPreviewSection business={business} />
        <PerformanceSection reviewsCount={business.reviews_count} />
        <ActivitySection hasActivity={business.reviews_count > 0} />
        <UpgradePromoSection />
        <QuickQuestionSection />
        <InsightsSection />
        <CompetitorSection />
        <EnhanceSection />
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantHome;
