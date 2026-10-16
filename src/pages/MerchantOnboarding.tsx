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
  { key: "photos", title: "Photos & logo", icon: Camera, hint: "Ajoutez des photos authentiques de votre entreprise pour présenter vos services." },
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
  const [city, setCity] = useState("");
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
      const { data: biz, error: businessError } = await supabase
        .from("businesses")
        .select("id,is_active,name,description,address,city,region,postal_code,phone,website,hours,country,latitude,longitude")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (businessError) {
        toast({ title: "Impossible de vérifier vos entreprises", description: businessError.message, variant: "destructive" });
        setCheckingExisting(false);
        return;
      }
      if (biz && biz.length > 0) {
        const existing = biz[0];
        if (!existing.is_active) {
          // Continue a real draft rather than redirecting it to a dashboard.
          setBusinessId(existing.id);
          setBusinessName(existing.name);
          setDescription(existing.description ?? "");
          setAddress(existing.address);
          setCity(existing.city);
          setRegion(existing.region ?? "QC");
          setPostalCode(existing.postal_code ?? "");
          setPhone(existing.phone ?? "");
          setWebsite(existing.website ?? "");
          setHoursText(existing.hours ?? "");
          setCountry(existing.country);
          setLatitude(existing.latitude);
          setLongitude(existing.longitude);
          const { data: linkedCategories, error: categoryError } = await supabase
            .from("business_categories")
            .select("category_id")
            .eq("business_id", existing.id);
          if (cancelled) return;
          if (categoryError) {
            toast({ title: "Erreur de récupération des catégories", description: categoryError.message, variant: "destructive" });
          } else {
            setSelectedCatIds(new Set((linkedCategories ?? []).map((row) => row.category_id)));
          }
          setStep(!categoryError && linkedCategories?.length ? 5 : 3);
          setCheckingExisting(false);
          return;
        }
        await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" }, { onConflict: "user_id,role", ignoreDuplicates: true });
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
      const meta = (user.user_metadata) || {};
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
    const { data: existing, error: checkError } = await supabase
      .from("businesses")
      .select("id,is_active")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (checkError) {
      toast({ title: "Vérification impossible", description: checkError.message, variant: "destructive" });
      return null;
    }
    if (existing?.length) {
      if (!existing[0].is_active) {
        // A previous attempt already inserted a draft; reuse it.
        return existing[0].id;
      }
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
        country: country || "CA",
        latitude,
        longitude,
        owner_user_id: user.id,
        // A self-registration is not an approved ownership claim.
        // Existing RLS requires false; admins approve claims separately.
        is_claimed: false,
        // Keep the draft private until the owner explicitly publishes it.
        is_active: false,

      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return null;
    }

    const { error: roleError } = await supabase.from("user_roles").upsert(
      { user_id: user.id, role: "merchant" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
    if (roleError) {
      toast({ title: "Accès professionnel non confirmé", description: roleError.message, variant: "destructive" });
      // Draft remains private and can be resumed later without duplicating it.
      return null;
    }
    try {
      await refreshRoles();
    } catch (error) {
      toast({ title: "Droits non vérifiés", description: error instanceof Error ? error.message : "Veuillez réessayer.", variant: "destructive" });
      return null;
    }
    return data.id;
  };

  // A resumed draft may have been edited since its first INSERT. Persist the
  // latest form values before allowing category/photo/review progression.
  const persistBusinessDraft = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const { data: saved, error } = await supabase
      .from("businesses")
      .update({
        name: businessName.trim(),
        description: description.trim() || null,
        address: address.trim(),
        city: city.trim(),
        region,
        postal_code: postalCode.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        hours: hoursText.trim() || null,
        country: country || "CA",
        latitude,
        longitude,
      })
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .eq("is_active", false)
      .select("id")
      .maybeSingle();
    if (error || !saved) {
      toast({
        title: "Brouillon non enregistré",
        description: error?.message || "La fiche n'est plus un brouillon modifiable. Rechargez la page.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const saveSelectedCategories = async (id: string): Promise<boolean> => {
    if (selectedCatIds.size === 0) {
      toast({ title: "Catégorie requise", description: "Choisissez au moins une catégorie avant la publication.", variant: "destructive" });
      setStep(3);
      return false;
    }
    const { data: existing, error: readError } = await supabase
      .from("business_categories")
      .select("category_id")
      .eq("business_id", id);
    if (readError) {
      toast({ title: "Lecture des catégories impossible", description: readError.message, variant: "destructive" });
      return false;
    }

    // Upsert adds selected categories; remove unselected categories from a
    // recovered draft. Only this owned business ID is ever modified.
    const rows = Array.from(selectedCatIds).map((categoryId) => ({ business_id: id, category_id: categoryId }));
    const { error: categoryError } = await supabase.from("business_categories").upsert(rows, {
      onConflict: "business_id,category_id",
      ignoreDuplicates: true,
    });
    if (categoryError) {
      toast({ title: "Enregistrement des catégories impossible", description: categoryError.message, variant: "destructive" });
      return false;
    }

    const toRemove = (existing ?? []).map((item) => item.category_id).filter((categoryId) => !selectedCatIds.has(categoryId));
    if (toRemove.length) {
      const { error: deleteError } = await supabase.from("business_categories")
        .delete().eq("business_id", id).in("category_id", toRemove);
      if (deleteError) {
        toast({ title: "Suppression des anciennes catégories impossible", description: deleteError.message, variant: "destructive" });
        return false;
      }
    }

    // Never call this step successful until the persisted set is exactly the
    // user's current selection, including deletion of deselected old rows.
    const { data: confirmed, error: verifyError } = await supabase.from("business_categories")
      .select("category_id").eq("business_id", id);
    const actual = new Set((confirmed ?? []).map((item) => item.category_id));
    if (verifyError || actual.size !== selectedCatIds.size || [...selectedCatIds].some((id) => !actual.has(id))) {
      toast({
        title: "Catégories non confirmées",
        description: verifyError?.message || "Vos modifications ne sont pas encore enregistrées. Réessayez.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const goNext = async () => {
    if (!canNext() || loading) return;
    if (step === 4) {
      setLoading(true);
      try {
        // Category persistence is retried for an existing draft as well.
        const id = businessId || await createBusiness();
        if (!id) return;
        setBusinessId(id);
        if (!await persistBusinessDraft(id)) return;
        if (!await saveSelectedCategories(id)) return;
        setStep(5);
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handlePublish = async () => {
    if (!businessId || !user || loading) return;
    setLoading(true);
    const { data: savedCategories, error: categoriesError } = await supabase
      .from("business_categories").select("category_id").eq("business_id", businessId).limit(1);
    if (categoriesError || !savedCategories?.length) {
      setLoading(false);
      setStep(3);
      toast({
        title: "Catégories manquantes",
        description: categoriesError?.message || "Ajoutez une catégorie à votre fiche avant de la publier.",
        variant: "destructive",
      });
      return;
    }
    // A resumed draft may predate the merchant-role write. Do not activate
    // the business until its owner has their real merchant entitlement.
    const { error: entitlementError } = await supabase.from("user_roles").upsert(
      { user_id: user.id, role: "merchant" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
    if (entitlementError) {
      setLoading(false);
      toast({ title: "Accès commerçant non confirmé", description: entitlementError.message, variant: "destructive" });
      return;
    }
    try {
      await refreshRoles();
    } catch (error) {
      setLoading(false);
      toast({ title: "Droits non vérifiés", description: error instanceof Error ? error.message : "Veuillez réessayer.", variant: "destructive" });
      return;
    }
    const { data: published, error } = await supabase
      .from("businesses")
      .update({ is_active: true })
      .eq("id", businessId)
      .eq("owner_user_id", user.id)
      .select("id")
      .maybeSingle();
    setLoading(false);
    if (error || !published) {
      toast({
        title: "Publication non confirmée",
        description: error?.message || "Impossible de publier ce commerce. Réessayez.",
        variant: "destructive",
      });
      return;
    }
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
                <span>Votre courriel est vérifié via le lien de confirmation envoyé à votre adresse.</span>
              </div>
            </div>

            <PhoneOtpVerification
              initialPhone={verifiedPhone || phone}
              verified={phoneVerified}
              onVerified={(p) => {
                setPhoneVerified(true);
                setVerifiedPhone(p);
                setPhone(p);
              }}
            />


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
            <AddressAutocomplete
              value={address}
              onChange={(v) => { setAddress(v); setLatitude(null); setLongitude(null); }}
              latitude={latitude}
              longitude={longitude}
              onResolved={(a: ResolvedAddress) => {
                setAddress(a.address || address);
                if (a.city) setCity(a.city);
                if (a.region) setRegion(a.region);
                if (a.postalCode) setPostalCode(a.postalCode);
                if (a.country) setCountry(a.country);
                setLatitude(a.latitude);
                setLongitude(a.longitude);
              }}
            />
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
          <Button onClick={handlePublish} disabled={loading} className="w-full rounded-full gap-2 bg-gradient-to-r from-primary to-accent">
            <Check size={16} /> Publier mon profil
          </Button>
        )}
      </div>
    </div>
  );
};

export default MerchantOnboarding;
