import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Building2, MapPin, Phone, Globe, ChevronRight, Check, QrCode,
  ShieldCheck, Tag, Clock, Camera, Sparkles, X, Loader2, Mail,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAllCategories } from "@/hooks/useAllCategories";
import BusinessMediaUploader from "@/components/media/BusinessMediaUploader";
import PhoneOtpVerification from "@/components/auth/PhoneOtpVerification";
import AddressAutocomplete, { type ResolvedAddress } from "@/components/business/AddressAutocomplete";


/**
 * Phase 18 — Guided 7-step merchant onboarding.
 * Preserves: duplicate-business guard, dual-role, RLS, replace-navigation.
 * No schema changes. Google Maps/Places stays a documented placeholder
 * until the connector is enabled by the owner.
 */

const steps = [
  { key: "account", title: "Compte & vérification", icon: ShieldCheck, hint: "On confirme votre identité pour sécuriser votre espace professionnel." },
  { key: "business", title: "Informations de l'entreprise", icon: Building2, hint: "Le nom que vos clients verront sur QMAPS." },
  { key: "address", title: "Adresse & localisation", icon: MapPin, hint: "Où vos clients peuvent vous trouver au Québec." },
  { key: "categories", title: "Catégories & services", icon: Tag, hint: "Aidez les clients à vous découvrir dans les bonnes recherches." },
  { key: "contact", title: "Heures & contact", icon: Clock, hint: "Téléphone, site web et disponibilités de base." },
  { key: "photos", title: "Photos & logo", icon: Camera, hint: "Une belle photo augmente les visites de 3x." },
  { key: "review", title: "Révision & publication", icon: Sparkles, hint: "Un dernier coup d'œil avant la mise en ligne." },
] as const;

const MerchantOnboarding = () => {
  const { user, loading: authLoading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories: allCats, loading: catsLoading } = useAllCategories();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Montréal");
  const [region, setRegion] = useState("QC");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [country, setCountry] = useState("CA");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Phone verification (Twilio Verify)
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");


  // Categories
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState("");

  // Created business (after step 5 → 6 transition)
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Duplicate guard — redirect existing owners.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?role=merchant");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);
      if (cancelled) return;
      if (biz && biz.length > 0) {
        await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
        await refreshRoles();
        navigate("/merchant", { replace: true });
        return;
      }

      // Existing phone verification status (server-controlled column).
      const { data: prof } = await supabase
        .from("profiles")
        .select("phone, phone_verified_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (prof?.phone) {
        setVerifiedPhone(prof.phone);
        if (!phone) setPhone(prof.phone);
      }
      if (prof?.phone_verified_at) setPhoneVerified(true);

      setCheckingExisting(false);

    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Pre-fill owner name from auth metadata
  useEffect(() => {
    if (user && !ownerName) {
      const meta = (user.user_metadata as any) || {};
      if (meta.display_name) setOwnerName(meta.display_name);
    }
  }, [user]);

  const canNext = () => {
    if (step === 0) return true; // account info is display-only
    if (step === 1) return businessName.trim().length >= 2;
    if (step === 2) return address.trim().length >= 3 && city.trim().length >= 2;
    if (step === 3) return selectedCatIds.size > 0;
    if (step === 4) return true; // contact/hours optional
    if (step === 5) return !!businessId; // photos step requires business created
    return true;
  };

  const toggleCat = (id: string) => {
    setSelectedCatIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      else toast({ title: "Maximum 5 catégories", description: "Retirez-en une pour en ajouter une autre." });
      return next;
    });
  };

  const catByParent = useMemo(() => {
    const map = new Map<string, string>();
    allCats.forEach(c => { if (!c.parent_id) map.set(c.id, c.name); });
    return map;
  }, [allCats]);

  const filteredCats = useMemo(() => {
    const q = catFilter.trim().toLowerCase();
    if (!q) {
      // Show a compact starter set: roots + selected
      const roots = allCats.filter(c => !c.parent_id).slice(0, 40);
      const extras = allCats.filter(c => selectedCatIds.has(c.id) && c.parent_id);
      return [...roots, ...extras];
    }
    return allCats
      .filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .slice(0, 80);
  }, [allCats, catFilter, selectedCatIds]);

  // Create the business at end of step 5 so we have an ID for photo upload in step 6.
  const createBusiness = async (): Promise<string | null> => {
    if (!user) return null;
    // Re-check at submit time (duplicate guard defeats double-click / dual-tab races).
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1);
    if (existing && existing.length > 0) {
      await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
      toast({ title: "Profil déjà créé", description: "Redirection vers votre tableau de bord." });
      navigate("/merchant", { replace: true });
      return null;
    }

    if (ownerName) {
      await supabase.from("profiles").update({ display_name: ownerName }).eq("id", user.id);
    }

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        description: description || null,
        address,
        city,
        region,
        postal_code: postalCode || null,
        phone: phone || null,
        website: website || null,
        hours: hoursText || null,
        owner_user_id: user.id,
        is_claimed: true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return null;
    }

    // Link selected categories
    if (selectedCatIds.size > 0) {
      const rows = Array.from(selectedCatIds).map(cid => ({ business_id: data.id, category_id: cid }));
      await supabase.from("business_categories").insert(rows);
    }

    await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
    await refreshRoles();
    return data.id;
  };

  const goNext = async () => {
    if (!canNext()) return;
    if (step === 4) {
      // Transitioning to photos → persist the business now
      if (!businessId) {
        setLoading(true);
        const id = await createBusiness();
        setLoading(false);
        if (!id) return;
        setBusinessId(id);
      }
      setStep(5);
      return;
    }
    setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handlePublish = async () => {
    if (!businessId) return;
    toast({ title: "Profil publié!", description: "Bienvenue sur QMAPS Professional." });
    navigate("/merchant", { replace: true });
  };

  if (authLoading || checkingExisting) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  const StepIcon = steps[step].icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <div className="px-4 pt-4">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <StepIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Étape {step + 1} sur {steps.length}
            </p>
            <h1 className="font-heading text-lg font-bold text-foreground leading-tight">
              {steps[step].title}
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{steps[step].hint}</p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step 1 — Account */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Check size={18} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Connecté avec</p>
                  <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex items-start gap-2 pt-2 border-t border-border">
                <Mail size={13} className="mt-0.5 shrink-0" />
                <span>Votre courriel est vérifié via le lien de confirmation Supabase. La vérification par SMS/appel sera disponible dès que Twilio Verify sera connecté.</span>
              </div>
            </div>

            {/* QR handoff */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg border border-border shrink-0">
                <QRCodeSVG value={`${window.location.origin}/merchant/onboarding?source=qr`} size={72} level="M" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <QrCode size={14} className="text-primary" />
                  <p className="text-xs font-semibold text-foreground">Continuer sur mobile</p>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Scannez pour reprendre l'inscription depuis votre téléphone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Business info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise *</Label>
              <Input placeholder="Ex: Café Montréal" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Nom du propriétaire</Label>
              <Input placeholder="Votre nom complet" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description courte</Label>
              <textarea
                placeholder="Que faites-vous? Ce qui vous rend unique..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[90px]"
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
            </div>
          </div>
        )}

        {/* Step 3 — Address */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Adresse *</Label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="123 Rue Principale" value={address} onChange={e => setAddress(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ville *</Label>
                <Input placeholder="Montréal" value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input placeholder="QC" value={region} onChange={e => setRegion(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input placeholder="H2X 1Y4" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>

            {/* Map placeholder — Google Maps/Places pending connector */}
            <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/40 to-transparent p-6 text-center space-y-2">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <MapPin size={20} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Carte interactive bientôt disponible</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                Autocomplétion d'adresse et aperçu carte s'activent dès que Google Maps sera connecté.
              </p>
            </div>
          </div>
        )}

        {/* Step 4 — Categories */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Rechercher une catégorie (ex: plombier, café...)"
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                className="pr-10"
              />
              {catFilter && (
                <button onClick={() => setCatFilter("")} className="absolute right-3 top-3 text-muted-foreground">
                  <X size={14} />
                </button>
              )}
            </div>

            {selectedCatIds.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {allCats.filter(c => selectedCatIds.has(c.id)).map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
                    className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  >
                    {c.name} <X size={12} />
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border max-h-[320px] overflow-y-auto divide-y divide-border">
              {catsLoading ? (
                <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">
                  <Loader2 size={16} className="animate-spin mr-2" /> Chargement des catégories...
                </div>
              ) : filteredCats.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Aucune catégorie trouvée.</div>
              ) : (
                filteredCats.map(c => {
                  const active = selectedCatIds.has(c.id);
                  const parent = c.parent_id ? catByParent.get(c.parent_id) : null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCat(c.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${active ? "bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                        {active && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        {parent && <p className="text-[11px] text-muted-foreground truncate">{parent}</p>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Choisissez jusqu'à 5 catégories. {selectedCatIds.size}/5 sélectionnées.
            </p>
          </div>
        )}

        {/* Step 5 — Hours & contact */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="+1 (514) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Site web</Label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="https://monsite.com" value={website} onChange={e => setWebsite(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Heures d'ouverture (résumé)</Label>
              <textarea
                placeholder="Ex: Lun-Ven 9h-17h, Sam 10h-15h, Fermé dimanche"
                value={hoursText}
                onChange={e => setHoursText(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[70px]"
              />
              <p className="text-xs text-muted-foreground">
                Vous pourrez configurer des horaires détaillés (jour par jour, congés) depuis votre tableau de bord.
              </p>
            </div>
          </div>
        )}

        {/* Step 6 — Photos */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Camera size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ajoutez vos meilleures photos</p>
                <p className="text-xs text-muted-foreground mt-1">Logo, intérieur, produits, équipe — tout ce qui donne envie de vous choisir.</p>
              </div>
              {businessId && user && (
                <BusinessMediaUploader
                  businessId={businessId}
                  userId={user.id}
                  kind="business"
                  onUploaded={(urls) => setUploadedPhotos(prev => [...prev, ...urls])}
                />
              )}
              {uploadedPhotos.length > 0 && (
                <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                  <Check size={12} /> {uploadedPhotos.length} photo(s) publiée(s)
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Étape optionnelle — vous pourrez toujours en ajouter depuis votre tableau de bord.
            </p>
          </div>
        )}

        {/* Step 7 — Review */}
        {step === 6 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sparkles size={16} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Aperçu de votre profil</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <p className="text-muted-foreground">Entreprise</p>
                <p className="col-span-2 font-medium text-foreground">{businessName}</p>
                <p className="text-muted-foreground">Adresse</p>
                <p className="col-span-2 font-medium text-foreground">{address}, {city} {postalCode}</p>
                {phone && (<><p className="text-muted-foreground">Téléphone</p><p className="col-span-2 font-medium text-foreground">{phone}</p></>)}
                {website && (<><p className="text-muted-foreground">Site web</p><p className="col-span-2 font-medium text-foreground truncate">{website}</p></>)}
                <p className="text-muted-foreground">Catégories</p>
                <p className="col-span-2 font-medium text-foreground">
                  {allCats.filter(c => selectedCatIds.has(c.id)).map(c => c.name).join(", ") || "—"}
                </p>
                <p className="text-muted-foreground">Photos</p>
                <p className="col-span-2 font-medium text-foreground">{uploadedPhotos.length}</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground flex items-start gap-2">
              <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
              <span>Votre entreprise est déjà enregistrée. Cliquez ci-dessous pour finaliser et accéder à votre tableau de bord.</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-background/95 backdrop-blur border-t border-border px-6 py-3">
        {step < steps.length - 1 ? (
          <Button
            onClick={goNext}
            disabled={!canNext() || loading}
            className="w-full rounded-full gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : <>Continuer <ChevronRight size={16} /></>}
          </Button>
        ) : (
          <Button onClick={handlePublish} className="w-full rounded-full gap-2 bg-gradient-to-r from-primary to-accent">
            <Check size={16} /> Publier mon profil
          </Button>
        )}
      </div>
    </div>
  );
};

export default MerchantOnboarding;
