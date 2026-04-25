import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProjectCategories } from "@/hooks/useProjectCategories";
import { useMerchantServiceSetup } from "@/hooks/useMerchantServiceSetup";

const MerchantServiceSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useProjectCategories();

  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [businessId, setBusinessId] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("id, name").eq("owner_user_id", user.id).then(({ data }) => {
      const list = (data ?? []) as { id: string; name: string }[];
      setBusinesses(list);
      if (list.length > 0) setBusinessId(list[0].id);
    });
  }, [user]);

  const {
    areas, categories: serviceCats, loading,
    addCategory, removeCategory, addArea, removeArea,
  } = useMerchantServiceSetup(businessId);

  const [newCat, setNewCat] = useState<string | undefined>();
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("QC");
  const [postal, setPostal] = useState("");
  const [radius, setRadius] = useState("");

  const handleAddCat = async () => {
    if (!newCat) return;
    const { error } = await addCategory(newCat);
    if (error) {
      const dup = /duplicate|unique|23505/i.test(error);
      toast({
        title: dup ? "Déjà ajoutée" : "Erreur",
        description: dup ? "Cette catégorie est déjà dans votre liste." : error,
        variant: "destructive",
      });
    } else { toast({ title: "Catégorie ajoutée" }); setNewCat(undefined); }
  };

  const handleAddArea = async () => {
    if (!city.trim() && !postal.trim()) {
      toast({ title: "Ajoutez au moins une ville ou un code postal", variant: "destructive" });
      return;
    }
    const { error } = await addArea({
      city: city.trim() || null,
      region: region.trim() || null,
      postal_code_prefix: postal.trim() || null,
      radius_km: radius ? Number(radius) : null,
    });
    if (error) {
      const dup = /duplicate|unique|23505/i.test(error);
      toast({
        title: dup ? "Zone déjà ajoutée" : "Erreur",
        description: dup ? "Cette zone existe déjà pour cette entreprise." : error,
        variant: "destructive",
      });
    } else { toast({ title: "Zone ajoutée" }); setCity(""); setPostal(""); setRadius(""); }
  };

  const catName = (id: string) => categories.find(c => c.id === id)?.name ?? "Catégorie";

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Mes services</h1>
        </div>

        {businesses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Vous devez d'abord créer une entreprise.</p>
        ) : (
          <>
            {businesses.length > 1 && (
              <div className="mb-4">
                <Label className="text-xs">Entreprise</Label>
                <Select value={businessId} onValueChange={setBusinessId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Categories */}
            <Card className="p-4 mb-4">
              <h2 className="font-heading text-base font-bold mb-3">Catégories de service</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Vous recevrez les demandes de projets correspondant à ces catégories.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {loading ? (
                  <p className="text-xs text-muted-foreground">Chargement...</p>
                ) : serviceCats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune catégorie.</p>
                ) : serviceCats.map(sc => (
                  <Badge key={sc.id} variant="secondary" className="gap-1">
                    {catName(sc.category_id)}
                    <button onClick={() => removeCategory(sc.id)}><X size={12} /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value={newCat} onValueChange={setNewCat}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Ajouter une catégorie" /></SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(c => !serviceCats.some(sc => sc.category_id === c.id))
                      .map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAddCat} disabled={!newCat}>
                  <Plus size={14} />
                </Button>
              </div>
            </Card>

            {/* Service areas */}
            <Card className="p-4">
              <h2 className="font-heading text-base font-bold mb-3">Zones desservies</h2>
              <div className="space-y-2 mb-3">
                {areas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune zone.</p>
                ) : areas.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-muted/40 rounded-lg p-2">
                    <span className="text-xs text-foreground">
                      {[a.city, a.region, a.postal_code_prefix].filter(Boolean).join(" · ")}
                      {a.radius_km ? ` · ${a.radius_km} km` : ""}
                    </span>
                    <button onClick={() => removeArea(a.id)}><X size={14} className="text-muted-foreground" /></button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Ville" value={city} onChange={e => setCity(e.target.value)} />
                  <Input placeholder="Province" value={region} onChange={e => setRegion(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Préfixe postal (H2X)" value={postal} onChange={e => setPostal(e.target.value)} />
                  <Input placeholder="Rayon km" type="number" inputMode="numeric" value={radius} onChange={e => setRadius(e.target.value)} />
                </div>
                <Button size="sm" className="w-full rounded-full" onClick={handleAddArea}>
                  <Plus size={14} className="mr-1" /> Ajouter une zone
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
      <MerchantBottomNav />
    </div>
  );
};

export default MerchantServiceSetup;
