import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import { ArrowLeft, Plus, Store, Star, MessageSquare, Settings, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const MerchantDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Tables<"businesses"> | null>(null);
  const [reviews, setReviews] = useState<(Tables<"reviews"> & { profiles?: { display_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"overview" | "edit" | "reviews">("overview");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editPrice, setEditPrice] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    fetchBusinesses();
  }, [user, authLoading]);

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user!.id);
    setBusinesses(data || []);
    if (data && data.length > 0) selectBiz(data[0]);
    setLoading(false);
  };

  const selectBiz = async (biz: Tables<"businesses">) => {
    setSelectedBiz(biz);
    setEditName(biz.name);
    setEditDesc(biz.description || "");
    setEditPhone(biz.phone || "");
    setEditAddress(biz.address);
    setEditHours(biz.hours || "");
    setEditPrice(biz.price_level || 1);

    const { data: revData } = await supabase
      .from("reviews")
      .select("*, profiles:user_id(display_name)")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false });
    setReviews((revData as any) || []);
  };

  const handleSave = async () => {
    if (!selectedBiz) return;
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: editName,
        description: editDesc,
        phone: editPhone,
        address: editAddress,
        hours: editHours,
        price_level: editPrice,
      })
      .eq("id", selectedBiz.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sauvegardé!" });
      fetchBusinesses();
    }
    setSaving(false);
  };

  const handleCreateBusiness = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        name: "Mon entreprise",
        address: "Montréal, QC",
        owner_user_id: user.id,
        is_claimed: true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else if (data) {
      // Add merchant role
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

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Tableau de bord</h1>
        </div>

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
              {[
                { key: "overview" as const, label: "Aperçu", icon: Star },
                { key: "edit" as const, label: "Modifier", icon: Settings },
                { key: "reviews" as const, label: "Avis", icon: MessageSquare },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
                    tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            {selectedBiz && tab === "overview" && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <h2 className="font-heading font-semibold text-foreground text-lg">{selectedBiz.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedBiz.address}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={Number(selectedBiz.avg_rating)} showValue />
                    </div>
                    <span className="text-sm text-muted-foreground">({selectedBiz.reviews_count} avis)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedBiz.reviews_count}</p>
                    <p className="text-xs text-muted-foreground">Avis total</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{Number(selectedBiz.avg_rating).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Note moyenne</p>
                  </div>
                </div>
              </div>
            )}

            {selectedBiz && tab === "edit" && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                  <div><Label>Nom</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                  <div><Label>Description</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} /></div>
                  <div><Label>Téléphone</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
                  <div><Label>Adresse</Label><Input value={editAddress} onChange={e => setEditAddress(e.target.value)} /></div>
                  <div><Label>Heures</Label><Input value={editHours} onChange={e => setEditHours(e.target.value)} placeholder="9h - 17h" /></div>
                  <div>
                    <Label>Niveau de prix</Label>
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4].map(p => (
                        <button
                          key={p}
                          onClick={() => setEditPrice(p)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            editPrice === p ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                          }`}
                        >
                          {"$".repeat(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full rounded-full gap-2" disabled={saving}>
                    <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </div>
            )}

            {selectedBiz && tab === "reviews" && (
              <div className="space-y-3">
                {reviews.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">Aucun avis pour le moment</p>
                )}
                {reviews.map(r => (
                  <div key={r.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {(r as any).profiles?.display_name || "Utilisateur"}
                      </p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                    <p className="text-sm text-foreground mt-2">{r.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(r.created_at).toLocaleDateString("fr-CA")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default MerchantDashboard;
