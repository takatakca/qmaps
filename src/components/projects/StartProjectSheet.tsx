import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjectRequests } from "@/hooks/useProjectRequests";
import { useProjectCategories } from "@/hooks/useProjectCategories";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategoryId?: string | null;
}

const StartProjectSheet = ({ open, onOpenChange, defaultCategoryId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useProjectCategories();
  const { createRequest } = useProjectRequests();

  const [categoryId, setCategoryId] = useState<string | undefined>(defaultCategoryId ?? undefined);
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

  // Sync default category whenever the sheet opens or default changes
  useEffect(() => {
    if (open) {
      setCategoryId(defaultCategoryId ?? undefined);
    }
  }, [open, defaultCategoryId]);

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
      if (upErr) {
        console.error("media upload failed", upErr);
        continue;
      }
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("project_request_media" as any).insert({
        project_request_id: projectRequestId,
        url: data.publicUrl,
        media_type: file.type.startsWith("video/") ? "video" : "photo",
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
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
    if (files.length > 0) {
      await uploadMedia(data.id);
    }
    setSubmitting(false);
    toast({ title: "Projet publié", description: "Les pros pourront vous envoyer des devis." });
    reset();
    onOpenChange(false);
    navigate(`/projects/${data.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Démarrer un projet</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-8">
          <div>
            <Label className="text-xs">Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Titre du projet *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Rénovation cuisine" maxLength={120} />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Décrivez ce dont vous avez besoin..." maxLength={2000} />
          </div>

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
            <Label className="text-xs">Code postal *</Label>
            <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="H2X 1Y4" />
            <p className="text-[10px] text-muted-foreground mt-1">Ville ou code postal requis.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Budget min ($)</Label>
              <Input type="number" inputMode="numeric" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Budget max ($)</Label>
              <Input type="number" inputMode="numeric" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
            </div>
          </div>

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

          {/* Optional photo upload */}
          <div>
            <Label className="text-xs">Photos (optionnel)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFilePick}
              />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full">
            {submitting ? "Publication..." : "Publier le projet"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StartProjectSheet;
