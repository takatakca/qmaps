import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProjectRequests } from "@/hooks/useProjectRequests";
import { useProjectCategories } from "@/hooks/useProjectCategories";

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

  const reset = () => {
    setTitle(""); setDescription(""); setCity(""); setPostalCode("");
    setBudgetMin(""); setBudgetMax(""); setUrgency("flexible"); setContact("in_app");
    setCategoryId(defaultCategoryId ?? undefined);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!title.trim()) {
      toast({ title: "Titre requis", description: "Donnez un titre à votre projet.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await createRequest({
      category_id: categoryId ?? null,
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
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Projet publié", description: "Les pros pourront vous envoyer des devis." });
    reset();
    onOpenChange(false);
    if (data?.id) navigate(`/projects/${data.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Démarrer un projet</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-8">
          <div>
            <Label className="text-xs">Catégorie</Label>
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
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Rénovation cuisine" />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Décrivez ce dont vous avez besoin..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ville</Label>
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

          <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full">
            {submitting ? "Publication..." : "Publier le projet"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StartProjectSheet;
