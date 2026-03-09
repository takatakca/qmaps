import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import StarRating from "@/components/StarRating";
import {
  ArrowLeft, Camera, MapPin, Phone, Globe, Clock,
  ChevronRight, Pencil, Plus, Loader2, Image as ImageIcon,
  Tag, FileText, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const MerchantMarketplace = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
        const { data: bc } = await supabase.from("business_categories").select("category_id").eq("business_id", biz.id);
        if (bc && bc.length > 0) {
          const { data: cats } = await supabase.from("categories").select("*").in("id", bc.map(b => b.category_id));
          setCategories(cats || []);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user, authLoading]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `business-photos/${business.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) { toast({ title: "Erreur", description: uploadErr.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const newPhotos = [...(business.photos || []), urlData.publicUrl];
    await supabase.from("businesses").update({ photos: newPhotos }).eq("id", business.id);
    setBusiness({ ...business, photos: newPhotos });
    toast({ title: "Photo ajoutée!" });
    setUploading(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">Aucune entreprise trouvée.</p>
        <Button onClick={() => navigate("/merchant/onboarding")} className="rounded-full mt-4">Créer mon entreprise</Button>
        <MerchantBottomNav />
      </div>
    );
  }

  const infoSections = [
    { icon: MapPin, label: "Adresse", value: `${business.address}, ${business.city}`, route: "/merchant/business-info" },
    { icon: Phone, label: "Téléphone", value: business.phone || "Ajouter", route: "/merchant/business-info" },
    { icon: Globe, label: "Site web", value: business.website || "Ajouter", route: "/merchant/business-info" },
    { icon: Clock, label: "Horaires", value: business.hours || "Configurer", route: "/merchant/business-info" },
    { icon: FileText, label: "Description", value: business.description ? "Modifier" : "Ajouter", route: "/merchant/business-info" },
    { icon: Tag, label: "Commodités", value: `${business.amenities?.length || 0} commodités`, route: "/merchant/business-info" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant/home")}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground flex-1">Ma vitrine</h1>
        <button onClick={() => navigate("/merchant/business-info")}>
          <Pencil size={18} className="text-primary" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero / Preview */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="h-36 bg-muted relative">
            {business.image_url ? (
              <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={32} className="text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm rounded-full p-2 border border-border"
            >
              {uploading ? <Loader2 size={16} className="animate-spin text-muted-foreground" /> : <Camera size={16} className="text-foreground" />}
            </button>
          </div>
          <div className="bg-card p-4">
            <h2 className="font-heading text-lg font-bold text-foreground">{business.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={business.avg_rating} size={14} />
              <span className="text-xs text-muted-foreground">{business.avg_rating.toFixed(1)} ({business.reviews_count} avis)</span>
            </div>
            {business.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{business.description}</p>}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground text-sm">Catégories</h3>
            <button onClick={() => navigate("/merchant/business-info")} className="text-xs text-primary font-medium">Modifier</button>
          </div>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span key={c.id} className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  {c.icon} {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Aucune catégorie. <button onClick={() => navigate("/merchant/business-info")} className="text-primary font-medium">Ajouter →</button></p>
          )}
        </div>

        {/* Info sections */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {infoSections.map((s, i) => (
            <button key={i} onClick={() => navigate(s.route)} className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
              <s.icon size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground truncate">{s.value}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Photos gallery */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground text-sm">Photos</h3>
            <button onClick={() => navigate("/merchant/photos")} className="text-xs text-primary font-medium">Gérer →</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(business.photos || []).slice(0, 5).map((p, i) => (
              <img key={i} src={p} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center shrink-0 hover:border-primary/40 transition-colors"
            >
              {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <Plus size={20} className="text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Verification */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Vérification de l'entreprise</p>
              <p className="text-xs text-muted-foreground">{business.is_claimed ? "Entreprise vérifiée" : "Non vérifiée"}</p>
            </div>
            {business.is_claimed && <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-medium">Vérifiée</span>}
          </div>
        </div>
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantMarketplace;
