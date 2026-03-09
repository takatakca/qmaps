import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import MerchantOverview from "@/components/merchant/MerchantOverview";
import MerchantPerformance from "@/components/merchant/MerchantPerformance";
import MerchantEditForm from "@/components/merchant/MerchantEditForm";
import MerchantReviews from "@/components/merchant/MerchantReviews";
import { ArrowLeft, Plus, Store, LayoutDashboard, BarChart3, Settings, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const MerchantDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Tables<"businesses"> | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "performance" | "edit" | "reviews">("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/merchant/login"); return; }
    fetchBusinesses();
  }, [user, authLoading]);

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase.from("businesses").select("*").eq("owner_user_id", user!.id);
    setBusinesses(data || []);
    if (data && data.length > 0) selectBiz(data[0]);
    setLoading(false);
  };

  const selectBiz = async (biz: Tables<"businesses">) => {
    setSelectedBiz(biz);
    const { data: revData } = await supabase
      .from("reviews")
      .select("*, profiles:user_id(display_name)")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false });
    setReviews((revData as any) || []);
  };

  const handleCreateBusiness = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("businesses")
      .insert({ name: "Mon entreprise", address: "Montréal, QC", owner_user_id: user.id, is_claimed: true })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else if (data) {
      await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
      fetchBusinesses();
      setTab("edit");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Aperçu", icon: LayoutDashboard },
    { key: "performance" as const, label: "Stats", icon: BarChart3 },
    { key: "edit" as const, label: "Modifier", icon: Settings },
    { key: "reviews" as const, label: "Avis", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground">
              FLEXS <span className="text-primary">Dashboard</span>
            </h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4 ml-12">Gérez votre entreprise sur QMAPS</p>

        {businesses.length === 0 ? (
          <div className="text-center py-16">
            <Store size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading font-semibold text-foreground mb-2">Aucune entreprise</h2>
            <p className="text-sm text-muted-foreground mb-6">Ajoutez votre entreprise pour commencer</p>
            <Button onClick={handleCreateBusiness} className="rounded-full gap-2">
              <Plus size={16} /> Ajouter une entreprise
            </Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-secondary rounded-full p-1 mb-4">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-colors ${
                    tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {selectedBiz && tab === "overview" && <MerchantOverview business={selectedBiz} reviews={reviews} onRefresh={fetchBusinesses} />}
            {selectedBiz && tab === "performance" && <MerchantPerformance business={selectedBiz} />}
            {selectedBiz && tab === "edit" && <MerchantEditForm business={selectedBiz} onSaved={fetchBusinesses} />}
            {selectedBiz && tab === "reviews" && <MerchantReviews reviews={reviews} />}
          </>
        )}
      </div>
      <MerchantBottomNav />
    </div>
  );
};

export default MerchantDashboard;
