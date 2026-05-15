import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import StarRating from "@/components/StarRating";
import EditBasicInfoModal from "@/components/merchant/info/EditBasicInfoModal";
import EditAddressModal from "@/components/merchant/info/EditAddressModal";
import EditHoursModal from "@/components/merchant/info/EditHoursModal";
import EditSpecialtiesModal from "@/components/merchant/info/EditSpecialtiesModal";
import EditHistoryModal from "@/components/merchant/info/EditHistoryModal";
import EditCategoryModal from "@/components/merchant/info/EditCategoryModal";
import EditAmenitiesModal from "@/components/merchant/info/EditAmenitiesModal";
import EditStatusModal from "@/components/merchant/info/EditStatusModal";
import {
  Camera, MapPin, Phone, Globe, Clock, ChevronRight, Pencil, Plus, Loader2,
  Star, Lock, Sparkles, Image as ImageIcon, BarChart3, HelpCircle,
  ClipboardCheck, CheckCircle2, Megaphone, Highlighter, MonitorPlay,
  ShieldBan, Link2, PhoneCall, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const MerchantMarketplace = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Modal states
  const [editBasic, setEditBasic] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editHours, setEditHours] = useState(false);
  const [editSpecialties, setEditSpecialties] = useState(false);
  const [editHistory, setEditHistory] = useState(false);
  const [editCategories, setEditCategories] = useState(false);
  const [editAmenities, setEditAmenities] = useState(false);
  const [refreshingAmenities, setRefreshingAmenities] = useState(false);
  const [editStatus, setEditStatus] = useState(false);

  const fetchBusiness = async (showPageLoader = false) => {
    if (!user) return;
    if (showPageLoader) setLoading(true);
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
      } else {
        setCategories([]);
      }
    }
    if (showPageLoader) setLoading(false);
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchBusiness(true);
  }, [user, authLoading]);

  const openAmenitiesEditor = async () => {
    setEditAmenities(true);
    setRefreshingAmenities(true);
    await fetchBusiness(false);
    setRefreshingAmenities(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `business-photos/${business.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) { toast({ title: "Erreur", description: uploadErr.message, variant: "destructive" }); setUploading(false); e.target.value = ""; return; }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const newPhotos = [...(business.photos || []), urlData.publicUrl];
    const { error: updateErr } = await supabase.from("businesses").update({ photos: newPhotos }).eq("id", business.id);
    if (updateErr) {
      toast({ title: "Erreur", description: updateErr.message, variant: "destructive" });
    } else {
      setBusiness({ ...business, photos: newPhotos });
      toast({ title: "Photo ajoutée!" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business) return;
    setUploadingCover(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `business-covers/${business.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) { toast({ title: "Erreur", description: uploadErr.message, variant: "destructive" }); setUploadingCover(false); e.target.value = ""; return; }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const { error: updateErr } = await supabase.from("businesses").update({ image_url: urlData.publicUrl }).eq("id", business.id);
    if (updateErr) {
      toast({ title: "Erreur", description: updateErr.message, variant: "destructive" });
    } else {
      setBusiness({ ...business, image_url: urlData.publicUrl });
      toast({ title: "Photo de couverture mise à jour!" });
    }
    setUploadingCover(false);
    e.target.value = "";
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

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayNamesFr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const parseHours = () => {
    if (!business.hours) return null;
    return dayNamesFr.map((d, i) => {
      const match = business.hours?.includes(d);
      const segment = business.hours?.split(",").find(s => s.trim().startsWith(d));
      const time = segment ? segment.split(":").slice(1).join(":").trim() : "Fermé";
      return { day: d, time: time || "9:00 - 17:00" };
    });
  };

  const hoursData = parseHours();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      {/* ===== HEADER BANNER ===== */}
      <div className="relative">
        <div className="h-48 bg-muted relative overflow-hidden">
          {business.image_url ? (
            <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <Camera size={40} className="text-muted-foreground" />
            </div>
          )}
          {/* Edit cover */}
          <button
            onClick={() => coverRef.current?.click()}
            className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm rounded-full p-2 border border-border"
          >
            {uploadingCover ? <Loader2 size={16} className="animate-spin text-muted-foreground" /> : <Camera size={16} className="text-foreground" />}
          </button>
          {/* Business logo placeholder */}
          <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-card/80 border border-border flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">{business.name.charAt(0)}</span>
          </div>
        </div>
        {/* Business info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-white">{business.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={business.avg_rating} size={14} />
                <span className="text-sm text-white/90 font-medium">{business.avg_rating.toFixed(1)}</span>
                <span className="text-sm text-white/70">({business.reviews_count} avis)</span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">Voir les {(business.photos?.length || 0)} photos</p>
            </div>
            <button onClick={() => setEditBasic(true)} className="bg-card/80 backdrop-blur-sm rounded-full p-2 border border-border">
              <Pencil size={16} className="text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTION BUTTONS ===== */}
      <div className="flex items-center justify-around py-4 bg-card border-b border-border">
        <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Plus size={20} className="text-foreground" />
          </div>
          <span className="text-xs text-foreground font-medium">Ajouter photo</span>
        </button>
        <button onClick={() => navigate("/merchant/home")} className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Star size={20} className="text-foreground" />
          </div>
          <span className="text-xs text-foreground font-medium">Voir les avis</span>
        </button>
        <button onClick={() => navigate("/merchant/optimization")} className="flex flex-col items-center gap-1.5 relative">
          <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Sparkles size={8} /> Upgrade
          </span>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon size={20} className="text-foreground" />
          </div>
          <span className="text-xs text-foreground font-medium">Ajouter logo</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* ===== SUMMARY ALERT ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck size={28} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-heading font-bold text-foreground">Il est temps de vérifier votre résumé</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Les clients apprécient que les entreprises maintiennent leurs informations à jour. Veuillez confirmer si quelque chose a changé.
              </p>
              <div className="flex items-center gap-2 mt-3 mb-3">
                <StarRating rating={business.avg_rating} size={16} />
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600 mb-3">
                <CheckCircle2 size={14} />
                <span>Vérifié par le propriétaire de l'entreprise aujourd'hui</span>
              </div>
              <Button size="sm" className="rounded-full" onClick={() => setEditBasic(true)}>
                Vérifier le résumé
              </Button>
            </div>
          </div>
        </div>

        {/* ===== CATEGORIES ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Catégories</h3>
            <button onClick={() => setEditCategories(true)} className="text-xs text-primary font-medium">Modifier</button>
          </div>
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map(c => (
                <button key={c.id} onClick={() => setEditCategories(true)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors">
                  <span className="text-sm text-foreground">{c.icon} {c.name}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune catégorie. <button onClick={() => setEditCategories(true)} className="text-primary font-medium">Ajouter →</button></p>
          )}
        </div>

        {/* ===== UPGRADE PROMO ===== */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4">
          <p className="text-sm font-medium text-foreground">
            Captez l'attention de vos clients en améliorant vos fonctionnalités
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Améliorez votre visibilité et démarquez-vous de la concurrence.
          </p>
          <Button size="sm" variant="outline" className="rounded-full mt-3 border-primary text-primary" onClick={() => navigate("/merchant/optimization")}>
            Essayer l'amélioration
          </Button>
        </div>

        {/* ===== CALL TO ACTION ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Appel à l'action</h3>
            <button onClick={() => navigate("/merchant/cta")} className="text-xs text-primary font-medium">Modifier</button>
          </div>
          <div className="bg-accent/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">10% de réduction pour les nouveaux clients!</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full flex-1">
              <PhoneCall size={14} className="mr-1" /> Appeler
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Créez des boutons d'appel à l'action pour encourager les clients à agir. <button className="text-primary font-medium" onClick={() => navigate("/merchant/cta")}>En savoir plus</button>
          </p>
        </div>

        {/* ===== BUSINESS INFO ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Informations de l'entreprise</h3>

          {/* Map placeholder */}
          <div className="h-32 bg-muted rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={24} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{business.address}, {business.city}</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            <button onClick={() => setEditAddress(true)} className="w-full flex items-center gap-3 py-3 hover:bg-accent/30 transition-colors">
              <MapPin size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">Adresse</p>
                <p className="text-sm text-foreground">{business.address}, {business.city}</p>
              </div>
              <Pencil size={14} className="text-primary" />
            </button>
            <button onClick={() => setEditBasic(true)} className="w-full flex items-center gap-3 py-3 hover:bg-accent/30 transition-colors">
              <Phone size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="text-sm text-foreground">{business.phone || "Ajouter un numéro"}</p>
              </div>
              <Pencil size={14} className="text-primary" />
            </button>
            <button onClick={() => setEditBasic(true)} className="w-full flex items-center gap-3 py-3 hover:bg-accent/30 transition-colors">
              <Globe size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">Site web</p>
                <p className="text-sm text-foreground truncate">{business.website || "Ajouter un site web"}</p>
              </div>
              <Pencil size={14} className="text-primary" />
            </button>
          </div>
        </div>

        {/* ===== AMENITIES ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Commodités et plus</h3>
            <button onClick={openAmenitiesEditor} className="text-xs text-primary font-medium">Modifier</button>
          </div>
          {(business.amenities && business.amenities.length > 0) ? (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                {business.amenities.slice(0, 6).map((a, i) => (
                  <span key={i} className="bg-muted text-foreground text-xs px-3 py-1.5 rounded-full">{a}</span>
                ))}
              </div>
              {business.amenities.length > 6 && (
                <button onClick={() => setEditAmenities(true)} className="text-xs text-primary font-medium">
                  Voir tout ({business.amenities.length})
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune commodité. <button onClick={openAmenitiesEditor} className="text-primary font-medium">Ajouter →</button></p>
          )}
        </div>

        {/* ===== BUSINESS HOURS ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Heures d'ouverture</h3>
            <button onClick={() => setEditHours(true)} className="text-xs text-primary font-medium">Modifier</button>
          </div>
          {business.hours ? (
            <p className="text-sm text-foreground whitespace-pre-line">{business.hours}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Heures non configurées. <button onClick={() => setEditHours(true)} className="text-primary font-medium">Ajouter →</button></p>
          )}
          <Button variant="outline" size="sm" className="rounded-full mt-3 w-full" onClick={() => setEditHours(true)}>
            <Plus size={14} className="mr-1" /> Ajouter des heures spéciales
          </Button>
        </div>

        {/* ===== FROM THE BUSINESS ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">De cette entreprise</h3>

          {/* Specialties */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-foreground">Spécialités</p>
              <button onClick={() => setEditSpecialties(true)} className="text-xs text-primary font-medium">Modifier</button>
            </div>
            <p className="text-sm text-muted-foreground">
              {business.description || "Ajoutez une description de vos spécialités pour attirer plus de clients."}
            </p>
          </div>

          {/* History */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-foreground">Historique</p>
              <button onClick={() => setEditHistory(true)} className="text-xs text-primary font-medium">Modifier</button>
            </div>
            <p className="text-sm text-muted-foreground">Ajoutez l'histoire de votre entreprise.</p>
          </div>

          <Button variant="outline" size="sm" className="rounded-full w-full" onClick={() => setEditSpecialties(true)}>
            <Plus size={14} className="mr-1" /> Ajouter plus d'infos
          </Button>
        </div>

        {/* ===== PHOTOS & VIDEOS ===== */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Photos et vidéos</h3>
            <button onClick={() => navigate("/merchant/photos")} className="text-xs text-primary font-medium">Voir tout →</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(business.photos || []).slice(0, 4).map((p, i) => (
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

        {/* ===== SLIDESHOW (LOCKED) ===== */}
        <div className="bg-card rounded-xl border border-border p-4 opacity-80">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading font-bold text-foreground">Diaporama</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock size={10} /> Upgrade
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Créez un diaporama de vos meilleures photos pour impressionner vos clients dès la première visite.
          </p>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/merchant/optimization")}>
            En savoir plus
          </Button>
        </div>

        {/* ===== BUSINESS HIGHLIGHTS (LOCKED) ===== */}
        <div className="bg-card rounded-xl border border-border p-4 opacity-80">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading font-bold text-foreground">Points forts de l'entreprise</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock size={10} /> Upgrade
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Happy hour", "Familial", "Terrasse"].map(h => (
              <span key={h} className="bg-muted text-muted-foreground text-xs px-3 py-1.5 rounded-full">{h}</span>
            ))}
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/merchant/optimization")}>
            En savoir plus
          </Button>
        </div>

        {/* ===== BUSINESS STATUS ===== */}
        <button onClick={() => setEditStatus(true)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${business.is_open && business.is_active ? "bg-green-500" : !business.is_active ? "bg-muted-foreground" : "bg-amber-500"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {business.is_open && business.is_active
                  ? "L'entreprise est ouverte"
                  : !business.is_active
                    ? "L'entreprise est masquée"
                    : "L'entreprise est temporairement fermée"}
              </p>
              <p className="text-xs text-muted-foreground">
                {business.is_claimed ? "Entreprise vérifiée par le propriétaire" : "Marquer comme vérifiée"}
              </p>
            </div>
            <Pencil size={14} className="text-primary shrink-0" />
          </div>
        </button>
      </div>

      <MerchantBottomNav />

      {/* ===== EDIT MODALS ===== */}
      {editBasic && <EditBasicInfoModal open={editBasic} onClose={() => setEditBasic(false)} business={business} onSaved={fetchBusiness} />}
      {editAddress && <EditAddressModal open={editAddress} onClose={() => setEditAddress(false)} business={business} onSaved={fetchBusiness} />}
      {editHours && <EditHoursModal open={editHours} onClose={() => setEditHours(false)} business={business} onSaved={fetchBusiness} />}
      {editSpecialties && <EditSpecialtiesModal open={editSpecialties} onClose={() => setEditSpecialties(false)} business={business} onSaved={fetchBusiness} />}
      {editHistory && <EditHistoryModal open={editHistory} onClose={() => setEditHistory(false)} business={business} onSaved={fetchBusiness} />}
      {editCategories && <EditCategoryModal open={editCategories} onClose={() => setEditCategories(false)} business={business} onSaved={fetchBusiness} />}
      {editAmenities && <EditAmenitiesModal open={editAmenities} onClose={() => setEditAmenities(false)} business={business} onSaved={() => fetchBusiness(false)} isRefreshing={refreshingAmenities} />}
      {editStatus && <EditStatusModal open={editStatus} onClose={() => setEditStatus(false)} business={business} onSaved={fetchBusiness} />}
    </div>
  );
};

export default MerchantMarketplace;
