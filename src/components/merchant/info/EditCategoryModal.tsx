import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

const EditCategoryModal = ({ open, onClose, business, onSaved }: Props) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [initial, setInitial] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      supabase.from("categories").select("*").eq("is_active", true).order("name"),
      supabase.from("business_categories").select("category_id").eq("business_id", business.id),
    ]).then(([{ data: cats, error: catsErr }, { data: bc, error: bcErr }]) => {
      if (catsErr) toast({ title: "Erreur", description: catsErr.message, variant: "destructive" });
      if (bcErr) toast({ title: "Erreur", description: bcErr.message, variant: "destructive" });
      setCategories(cats || []);
      const ids = new Set((bc || []).map(d => d.category_id));
      setInitial(ids);
      setSelected(new Set(ids));
      setLoading(false);
    });
  }, [open, business.id, toast]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, filter]);

  const dirty = useMemo(() => {
    if (selected.size !== initial.size) return true;
    for (const id of selected) if (!initial.has(id)) return true;
    return false;
  }, [selected, initial]);

  const handleSave = async () => {
    setSaving(true);
    const toAdd = [...selected].filter(id => !initial.has(id));
    const toRemove = [...initial].filter(id => !selected.has(id));

    let firstError: string | null = null;
    if (toRemove.length) {
      const { error } = await supabase
        .from("business_categories")
        .delete()
        .eq("business_id", business.id)
        .in("category_id", toRemove);
      if (error) firstError = error.message;
    }
    if (!firstError && toAdd.length) {
      const { error } = await supabase
        .from("business_categories")
        .insert(toAdd.map(category_id => ({ business_id: business.id, category_id })));
      if (error) firstError = error.message;
    }
    setSaving(false);
    if (firstError) {
      toast({ title: "Erreur", description: firstError, variant: "destructive" });
      return;
    }
    toast({ title: "Catégories mises à jour!" });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && !saving && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Modifier les catégories</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          Aidez les clients à vous trouver sur QMAPS en choisissant les catégories qui décrivent le mieux votre entreprise.
        </p>

        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Rechercher une catégorie..."
          className="rounded-lg mb-3"
        />

        <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={16} /> Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Aucune catégorie trouvée.</p>
          ) : (
            filtered.map(cat => {
              const isSel = selected.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/30 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {cat.icon && <span>{cat.icon}</span>}
                    <span className="text-foreground">{cat.name}</span>
                  </span>
                  <span
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSel ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {isSel && <Check size={14} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {selected.size} catégorie(s) sélectionnée(s)
        </p>

        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
