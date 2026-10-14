import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import type { ReviewWithAuthor } from "@/lib/reviewsWithAuthors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/StarRating";
import {
  Camera, FileText, Phone, Pencil, MapPin, Globe, Clock,
  ChevronRight, ChevronDown, Megaphone, MessageSquare, Star,
  MousePointerClick, CalendarCheck, Building, Inbox, Receipt,
  Wifi, Car, Utensils, CreditCard, Accessibility, Baby,
  Wind, PartyPopper, ChefHat, Truck, Wine, Coffee,
  ArrowUpCircle, ImageIcon, Plus, Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAYS, DAY_LABELS_FR, parseWeeklyHours, formatDayHours } from "@/lib/businessHours";

interface Props {
  business: Tables<"businesses">;
  reviews: ReviewWithAuthor[];
  onRefresh?: () => void;
}

const MerchantOverview = ({ business, reviews, onRefresh }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: bcData } = await supabase
        .from("business_categories")
        .select("category_id")
        .eq("business_id", business.id);
      if (bcData && bcData.length > 0) {
        const catIds = bcData.map(bc => bc.category_id);
        const { data: cats } = await supabase
          .from("categories")
          .select("*")
          .in("id", catIds);
        setCategories(cats || []);
      } else {
        setCategories([]);
      }
    };
    fetchCategories();
  }, [business.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `business-photos/${business.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Erreur d'envoi", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const newPhotos = [...(business.photos || []), urlData.publicUrl];

    const { error } = await supabase.from("businesses").update({ photos: newPhotos }).eq("id", business.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Photo ajoutée!" });
      onRefresh?.();
    }
    setUploading(false);
  };

  const actionButtons = [
    { icon: Camera, label: "Ajouter photo", action: () => navigate("/merchant/photos") },
    { icon: FileText, label: "Description", action: () => navigate("/merchant/business-info") },
    {
      icon: Phone,
      label: business.phone ? "Appeler" : "Ajouter téléphone",
      action: () => {
        const phone = business.phone?.replace(/[^+\d]/g, "");
        if (phone) window.location.href = `tel:${phone}`;
        else navigate("/merchant/business-info");
      },
    },
    { icon: Pencil, label: "Modifier la page", action: () => navigate("/merchant/business-info") },
  ];

  const amenities = business.amenities || [];
  const amenityIcons: Record<string, LucideIcon> = {
    wifi: Wifi, parking: Car, delivery: Truck, credit_cards: CreditCard,
    wheelchair: Accessibility, kids_menu: Baby, ac: Wind, private_events: PartyPopper,
    catering: ChefHat, bar: Wine, brunch: Coffee, takeout: Utensils,
  };

  const structuredHours = parseWeeklyHours(business.hours_json);
  const weeklyRows = structuredHours
    ? DAYS.map((day) => ({ day: DAY_LABELS_FR[day], hours: formatDayHours(structuredHours[day]) }))
    : [];

  const products = [
    { icon: <Megaphone size={22} className="text-primary" />, title: "Publicités QMAPS", desc: "Touchez plus de clients.", cta: "Créer une publicité", route: "/merchant/ads" },
    { icon: <MessageSquare size={22} className="text-primary" />, title: "QMAPS Connect", desc: "Partagez des publications.", cta: "Découvrir", route: "/merchant/connect" },
    { icon: <MousePointerClick size={22} className="text-primary" />, title: "Call to Action", desc: "Convertissez les visites.", cta: "CA$2/jour", route: "/merchant/cta" },
    { icon: <Star size={22} className="text-primary" />, title: "Business Highlights", desc: "Badges et mise en valeur.", cta: "CA$2/jour", route: "/merchant/highlights" },
    { icon: <Camera size={22} className="text-primary" />, title: "Photos & Vidéos", desc: "Gérez vos photos.", cta: "Gérer", route: "/merchant/photos" },
    { icon: <Phone size={22} className="text-primary" />, title: "QMAPS Host", desc: "Réceptionniste virtuel IA.", cta: "Découvrir", route: "/merchant/host" },
    { icon: <CalendarCheck size={22} className="text-primary" />, title: "Guest Manager", desc: "Réservations en ligne.", cta: "Découvrir", route: "/merchant/guest-manager" },
    { icon: <Building size={22} className="text-primary" />, title: "Informations", desc: "Catégories, heures, adresse.", cta: "Modifier", route: "/merchant/business-info" },
    { icon: <Inbox size={22} className="text-primary" />, title: "Boîte de réception", desc: "Messages clients.", cta: "Voir", route: "/merchant/inbox" },
    { icon: <Receipt size={22} className="text-primary" />, title: "Facturation", desc: "Solde et paiements.", cta: "Voir", route: "/merchant/billing" },
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="h-40 bg-muted">
          {business.image_url && (
            <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="bg-card border border-border rounded-b-xl p-4 -mt-6 relative z-10 mx-2">
          <h2 className="font-heading text-xl font-bold text-foreground">{business.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={business.avg_rating} size={16} />
            <span className="text-sm text-muted-foreground">{business.avg_rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({business.reviews_count} avis)</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between gap-2">
        {actionButtons.map((btn, i) => (
          <button key={i} onClick={btn.action} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors">
            <btn.icon size={20} className="text-primary" />
            <span className="text-[10px] text-foreground font-medium text-center leading-tight">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Check your summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-1">Il est temps de vérifier votre résumé</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Vérifiez les horaires, la description, la catégorie et les renseignements publiés sur votre fiche QMAPS.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={business.avg_rating} size={18} />
        </div>
        <p className="text-xs text-muted-foreground italic mb-3">
          Vérifiez vos informations d'entreprise
        </p>
        <Button className="w-full rounded-full" onClick={() => navigate("/merchant/business-info")}>
          Vérifier le résumé
        </Button>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">Catégories</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Les catégories aident les clients à trouver votre entreprise. Elles apparaissent sur votre fiche.
        </p>
        <div className="space-y-2">
          {categories.length > 0 ? categories.map(cat => (
            <button key={cat.id} onClick={() => navigate("/merchant/business-info")} className="w-full flex items-center justify-between py-2 text-sm text-primary font-medium">
              <span>{cat.icon} {cat.name}</span>
              <ChevronRight size={16} />
            </button>
          )) : (
            <button onClick={() => navigate("/merchant/business-info")} className="text-sm text-primary font-medium">
              Ajouter des catégories →
            </button>
          )}
        </div>
      </div>

      {/* Upgrade banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ArrowUpCircle size={24} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Attirez l'attention de vos clients en améliorant votre fiche avec les fonctionnalités avancées.
            </p>
            <button onClick={() => navigate("/merchant/upgrade")} className="text-sm font-medium text-primary mt-2">
              Essayer la mise à niveau →
            </button>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">Call to Action</h3>
        <div className="space-y-3">
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
              Aucune promotion active configurée
            </div>
          </div>
          <button onClick={() => navigate("/merchant/cta")} className="w-full text-sm font-medium text-primary text-left">
            Configurer l'appel à l'action
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Incitez les visiteurs à passer à l'action avec des promotions, des offres spéciales ou un bouton d'appel direct.
        </p>
      </div>

      {/* Business Info */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-4">Informations</h3>
        <div className="space-y-4">
          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Adresse</p>
              <p className="text-sm text-muted-foreground">{business.address}</p>
              <p className="text-xs text-muted-foreground">{business.city}, {business.region} {business.postal_code}</p>
            </div>
          </div>
          {/* Phone */}
          <div className="flex items-start gap-3">
            <Phone size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Appeler</p>
              <p className="text-sm text-primary">{business.phone || "Ajouter un numéro"}</p>
            </div>
          </div>
          {/* Website */}
          <div className="flex items-start gap-3">
            <Globe size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Site web</p>
              <p className="text-sm text-primary truncate">{business.website || "Ajouter un site web"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">Commodités et plus</h3>
        <div className="grid grid-cols-2 gap-3">
          {(showAllAmenities ? amenities : amenities.slice(0, 4)).map((a, i) => {
            const IconComp = amenityIcons[a] || Utensils;
            return (
              <div key={i} className="flex items-center gap-2">
                <IconComp size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground capitalize">{a.replace(/_/g, " ")}</span>
              </div>
            );
          })}
        </div>
        {amenities.length > 4 && (
          <button onClick={() => setShowAllAmenities(!showAllAmenities)} className="flex items-center gap-1 text-sm font-medium text-primary mt-3">
            {showAllAmenities ? "Voir moins" : `Voir tout (${amenities.length})`}
            <ChevronDown size={14} className={showAllAmenities ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        )}
        {amenities.length === 0 && (
          <button onClick={() => navigate("/merchant/business-info")} className="text-sm text-primary font-medium">
            Ajouter des commodités →
          </button>
        )}
      </div>

      {/* Business Hours */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">Heures d'ouverture</h3>
        <div className="space-y-2">
          {structuredHours ? (
            (showAllHours ? weeklyRows : weeklyRows.slice(0, 3)).map((h) => (
              <div key={h.day} className="flex justify-between gap-3 text-sm">
                <span className="text-foreground font-medium">{h.day}</span>
                <span className="text-muted-foreground text-right">{h.hours}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {business.hours || "Heures non configurées. Ajoutez vos horaires pour informer vos clients."}
            </p>
          )}
        </div>
        {structuredHours && !showAllHours && (
          <button onClick={() => setShowAllHours(true)} className="flex items-center gap-1 text-sm font-medium text-primary mt-3">
            Voir tous les horaires <ChevronDown size={14} />
          </button>
        )}
        <button onClick={() => navigate("/merchant/business-info")} className="text-xs text-primary font-medium mt-3 block">
          Ajouter des heures spéciales →
        </button>
      </div>

      {/* From this business */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">De cette entreprise</h3>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">Réseaux sociaux</p>
            <p className="text-xs text-muted-foreground mt-1">Ajoutez vos liens de réseaux sociaux</p>
            <button onClick={() => navigate("/merchant/business-info")} className="text-xs text-primary font-medium mt-1">Modifier →</button>
          </div>
          <div className="border border-border rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">Histoire</p>
            <p className="text-xs text-muted-foreground mt-1">Racontez l'histoire de votre entreprise</p>
            <button onClick={() => navigate("/merchant/business-info")} className="text-xs text-primary font-medium mt-1">Ajouter l'historique →</button>
          </div>
        </div>
      </div>

      {/* Photos and videos */}
      <div className="bg-card rounded-xl border border-border p-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-foreground">Photos et vidéos</h3>
          <button onClick={() => navigate("/merchant/photos")} className="text-sm text-primary font-medium">
            Voir tout →
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Les utilisateurs sont 2,5x plus susceptibles de contacter une entreprise avec des photos. Ajoutez des photos pour attirer plus de clients.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(business.photos || []).slice(0, 4).map((p, i) => (
            <img key={i} src={p} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center shrink-0 hover:border-primary/40 transition-colors"
          >
            {uploading ? <Loader2 size={20} className="text-muted-foreground animate-spin" /> : <Plus size={20} className="text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Slideshow */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-2">Diaporama</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Créez un diaporama avec vos meilleures photos pour impressionner les visiteurs de votre page.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full text-xs gap-1" onClick={() => navigate("/merchant/photos")}>
            <ImageIcon size={14} /> Gérer les photos
          </Button>
        </div>
      </div>

      {/* Business Highlights */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground mb-3">Mise en valeur</h3>
        <p className="text-sm text-muted-foreground">
          Les distinctions et badges de votre entreprise seront affichés ici lorsqu'ils auront été réellement attribués.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Statut de la fiche : {business.is_claimed ? "Revendiquée" : "Non revendiquée"}.
        </p>
        <button onClick={() => navigate("/merchant/highlights")} className="text-sm text-primary font-medium mt-2">
          Découvrir les options →
        </button>
      </div>

      {/* Products grid */}
      <div className="space-y-3 mt-2">
        <h3 className="font-heading font-semibold text-foreground px-1">Produits et services QMAPS</h3>
        {products.map((p, i) => (
          <button
            key={i}
            onClick={() => navigate(p.route)}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{p.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{p.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MerchantOverview;
