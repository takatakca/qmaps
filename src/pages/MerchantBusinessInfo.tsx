import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, X, Clock, MapPin, Tag, Sparkles, BookOpen, Building, List, Truck, CreditCard, Wifi, Dog, Baby, Utensils, Phone as PhoneIcon, Globe, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

import EditCategoryModal from "@/components/merchant/info/EditCategoryModal";
import EditHoursModal from "@/components/merchant/info/EditHoursModal";
import EditAddressModal from "@/components/merchant/info/EditAddressModal";
import EditSpecialtiesModal from "@/components/merchant/info/EditSpecialtiesModal";
import EditHistoryModal from "@/components/merchant/info/EditHistoryModal";
import EditAmenitiesModal from "@/components/merchant/info/EditAmenitiesModal";
import EditBasicInfoModal from "@/components/merchant/info/EditBasicInfoModal";
import EditAttributesModal from "@/components/merchant/info/EditAttributesModal";

const MerchantBusinessInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCategory, setShowCategory] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);

  const fetchBusiness = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle();
    setBusiness(data);
    setLoading(false);
  };

  useEffect(() => { fetchBusiness(); }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Aucune entreprise trouvée.</p></div>;

  const sections = [
    { label: "Informations de base", icon: PenLine, value: `${business.name} · ${business.phone || ""}`, onClick: () => setShowBasicInfo(true) },
    { label: "Catégories", icon: Tag, value: "Restaurants", onClick: () => setShowCategory(true) },
    { label: "Heures d'ouverture", icon: Clock, value: business.hours || "Non définies", onClick: () => setShowHours(true) },
    { label: "Heures spéciales", icon: Clock, value: "Gérer les jours fériés", onClick: () => setShowHours(true) },
    { label: "Adresse", icon: MapPin, value: `${business.address}, ${business.city}`, onClick: () => setShowAddress(true) },
    { label: "Spécialités", icon: Sparkles, value: business.description?.substring(0, 40) || "Ajouter", onClick: () => setShowSpecialties(true) },
    { label: "Historique", icon: BookOpen, value: "Modifier l'historique", onClick: () => setShowHistory(true) },
    { label: "Commodités et plus", icon: List, value: `${business.amenities?.length || 0} options`, onClick: () => setShowAmenities(true) },
    { label: "Paiements, langues, accessibilité", icon: CreditCard, value: `${((business as any).payment_methods?.length || 0) + ((business as any).languages?.length || 0) + ((business as any).accessibility?.length || 0)} options`, onClick: () => setShowAttributes(true) },
  ];

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant")}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-base font-bold text-foreground">Informations de l'entreprise</h1>
      </div>

      <div className="px-4 pt-6">
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">{business.name}</h2>
        <p className="text-sm text-muted-foreground mb-6">{business.address}, {business.city}, {business.region}</p>

        <div className="space-y-1">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={s.onClick}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <s.icon size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground truncate">{s.value}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <EditCategoryModal open={showCategory} onClose={() => setShowCategory(false)} business={business} onSaved={fetchBusiness} />
      <EditHoursModal open={showHours} onClose={() => setShowHours(false)} business={business} onSaved={fetchBusiness} />
      <EditAddressModal open={showAddress} onClose={() => setShowAddress(false)} business={business} onSaved={fetchBusiness} />
      <EditSpecialtiesModal open={showSpecialties} onClose={() => setShowSpecialties(false)} business={business} onSaved={fetchBusiness} />
      <EditHistoryModal open={showHistory} onClose={() => setShowHistory(false)} business={business} onSaved={fetchBusiness} />
      <EditAmenitiesModal open={showAmenities} onClose={() => setShowAmenities(false)} business={business} onSaved={fetchBusiness} />
      <EditBasicInfoModal open={showBasicInfo} onClose={() => setShowBasicInfo(false)} business={business} onSaved={fetchBusiness} />
      <EditAttributesModal open={showAttributes} onClose={() => setShowAttributes(false)} business={business} onSaved={fetchBusiness} />
    </div>
  );
};

export default MerchantBusinessInfo;
