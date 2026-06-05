import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ImagePlus, X, Check, ChevronsUpDown, Briefcase, FileText,
  MapPin, DollarSign, MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjectRequests } from "@/hooks/useProjectRequests";
import { useProjectCategories } from "@/hooks/useProjectCategories";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategoryId?: string | null;
}

const SectionHeader = ({
  step, title, subtitle, icon: Icon,
}: {
  step: number; title: string; subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => (
  <div className="flex items-start gap-3 pt-2">
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
      <Icon size={16} />
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Étape {step}
        </span>
      </div>
      <h3 className="font-heading text-sm font-bold text-foreground leading-tight">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const StartProjectSheet = ({ open, onOpenChange, defaultCategoryId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useProjectCategories();
  const { createRequest } = useProjectRequests();

  const [categoryId, setCategoryId] = useState<string | undefined>(defaultCategoryId ?? undefined);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("QC");
  const [postalCode, setPostalCode] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [urgency, setUrgency] = useState("flexible");
  const [contact, setContact] = useState("in_app");
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setCategoryId(defaultCategoryId ?? undefined);
  }, [open, defaultCategoryId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  // Smart suggestions: filter categories based on title/description
  const smartSuggestions = useMemo(() => {
    const q = (title + " " + description).toLowerCase().trim();
    if (q.length < 3) return [];
    return categories
      .filter((c) => c.name.toLowerCase().includes(q.split(/\s+/)[0]))
      .slice(0, 4);
  }, [categories, title, description]);

  const reset = () => {
    setTitle(""); setDescription(""); setCity(""); setPostalCode("");
    setBudgetMin(""); setBudgetMax(""); setUrgency("flexible"); setContact("in_app");
    setCategoryId(defaultCategoryId ?? undefined);
    setFiles([]);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setFiles(prev => [...prev, ...Array.from(list)].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadMedia = async (projectRequestId: string) => {
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `project-requests/${projectRequestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
      if (upErr) { console.error("media upload failed", upErr); continue; }
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("project_request_media" as any).insert({
        project_request_id: projectRequestId,
        url: data.publicUrl,
        media_type: file.type.startsWith("video/") ? "video" : "photo",
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!categoryId) {
      toast({ title: "Catégorie requise", description: "Choisissez une catégorie de service.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Titre requis", description: "Donnez un titre à votre projet.", variant: "destructive" });
      return;
    }
    if (!city.trim() && !postalCode.trim()) {
      toast({ title: "Localisation requise", description: "Indiquez une ville ou un code postal.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await createRequest({
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      city: city.trim() || null,
      region: region.trim() || null,
      postal_code: postalCode.trim() || null,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      urgency,
      preferred_contact_method: contact,
    });
    if (error || !data) {
      setSubmitting(false);
      toast({ title: "Erreur", description: error ?? "Impossible de créer le projet", variant: "destructive" });
      return;
    }
    if (files.length > 0) await uploadMedia(data.id);
    setSubmitting(false);
    toast({ title: "Projet publié", description: "Les pros pourront vous envoyer des devis." });
    reset();
    onOpenChange(false);
    navigate(`/projects/${data.id}`);
  };

  // Progress count (5 sections)
  const completed =
    Number(!!categoryId) +
    Number(!!title.trim()) +
    Number(!!(city.trim() || postalCode.trim())) +
    Number(!!(budgetMin || budgetMax)) +
    Number(!!contact);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading text-xl">Démarrer un projet</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Décrivez votre besoin — les pros qualifiés du Québec vous enverront leurs devis.
          </p>
          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-brand-gradient transition-all"
                style={{ width: `${(completed / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{completed}/5</span>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-4 pb-8">
          {/* 1. Service demandé */}
          <section className="space-y-3">
            <SectionHeader step={1} title="Service demandé" subtitle="Choisissez la catégorie qui décrit le mieux votre besoin." icon={Briefcase} />
            <div className="pl-11">
              <Label className="text-xs">Catégorie *</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className={cn(
                      "w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent/30 transition-colors mt-1",
                      !selectedCategory && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate text-left">
                      {selectedCategory ? selectedCategory.name : "Rechercher une catégorie…"}
                    </span>
                    <ChevronsUpDown size={14} className="ml-2 opacity-50 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter>
                    <CommandInput placeholder="Tapez pour rechercher parmi toutes les catégories…" />
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((c) => {
                          const parts = c.slug?.split("--") ?? [];
                          const parent = parts.length > 1 ? parts[0].replace(/-/g, " ") : null;
                          return (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.slug ?? ""}`}
                              onSelect={() => { setCategoryId(c.id); setCategoryOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-3 w-3", categoryId === c.id ? "opacity-100" : "opacity-0")} />
                              <span className="flex-1 truncate">{c.name}</span>
                              {parent && (
                                <span className="ml-2 text-[10px] text-muted-foreground capitalize truncate max-w-[100px]">
                                  {parent}
                                </span>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-muted-foreground mt-1">
                Plus de {categories.length} catégories disponibles — tapez pour filtrer.
              </p>
            </div>
          </section>

          {/* 2. Détails du projet */}
          <section className="space-y-3">
            <SectionHeader step={2} title="Détails du projet" subtitle="Plus de précisions = meilleurs devis." icon={FileText} />
            <div className="pl-11 space-y-3">
              <div>
                <Label className="text-xs">Titre du projet *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Rénovation cuisine, ménage hebdomadaire…" maxLength={120} />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="Décrivez ce dont vous avez besoin, vos contraintes, délais, surface, etc." maxLength={2000} />
                <p className="text-[10px] text-muted-foreground mt-1">{description.length}/2000</p>
              </div>

              {smartSuggestions.length > 0 && !categoryId && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    Suggestions intelligentes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    D'après votre titre, voici des catégories suggérées :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {smartSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCategoryId(s.id)}
                        className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              <div>
                <Label className="text-xs">Photos (optionnel)</Label>
                <p className="text-[10px] text-muted-foreground mb-2">Aidez les pros à mieux comprendre votre besoin.</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {files.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-accent"
                    >
                      <ImagePlus size={20} />
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilePick} />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Localisation */}
          <section className="space-y-3">
            <SectionHeader step={3} title="Localisation" subtitle="Pour trouver les pros près de chez vous." icon={MapPin} />
            <div className="pl-11 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ville *</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Montréal" />
                </div>
                <div>
                  <Label className="text-xs">Province</Label>
                  <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="QC" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Code postal</Label>
                <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="H2X 1Y4" />
                <p className="text-[10px] text-muted-foreground mt-1">Ville ou code postal requis.</p>
              </div>
            </div>
          </section>

          {/* 4. Budget */}
          <section className="space-y-3">
            <SectionHeader step={4} title="Budget" subtitle="Une fourchette aide les pros à mieux répondre." icon={DollarSign} />
            <div className="pl-11">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Budget min ($)</Label>
                  <Input type="number" inputMode="numeric" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="500" />
                </div>
                <div>
                  <Label className="text-xs">Budget max ($)</Label>
                  <Input type="number" inputMode="numeric" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="2000" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Vous pouvez laisser vide si vous n'êtes pas sûr.</p>
            </div>
          </section>

          {/* 5. Contact / préférence */}
          <section className="space-y-3">
            <SectionHeader step={5} title="Contact et préférences" subtitle="Comment souhaitez-vous être joint ?" icon={MessageSquare} />
            <div className="pl-11">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Urgence</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="this_week">Cette semaine</SelectItem>
                      <SelectItem value="this_month">Ce mois-ci</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Contact préféré</Label>
                  <Select value={contact} onValueChange={setContact}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">Messagerie QMAPS</SelectItem>
                      <SelectItem value="phone">Téléphone</SelectItem>
                      <SelectItem value="email">Courriel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full h-12 text-sm font-semibold">
            {submitting ? "Publication..." : "Publier le projet"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Gratuit • Recevez des devis de pros qualifiés du Québec.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StartProjectSheet;
