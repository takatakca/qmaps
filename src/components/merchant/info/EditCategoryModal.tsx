import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, X } from "lucide-react";
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
  const [assigned, setAssigned] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from("business_categories").select("category_id").eq("business_id", business.id).then(({ data }) => {
      if (data) setAssigned(data.map(d => d.category_id));
    });
  }, [open, business.id]);

  const assignedCats = categories.filter(c => assigned.includes(c.id));

  const removeCategory = async (catId: string) => {
    await supabase.from("business_categories").delete().eq("business_id", business.id).eq("category_id", catId);
    setAssigned(prev => prev.filter(id => id !== catId));
    toast({ title: "Catégorie supprimée" });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">Modifier les catégories</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Aidez les clients à vous trouver sur QMAPS en choisissant les catégories qui décrivent le mieux votre entreprise.
        </p>

        <div className="space-y-2 mb-6">
          {assignedCats.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
              </div>
              <button onClick={() => removeCategory(cat.id)} className="text-xs text-primary font-medium">Modifier</button>
            </div>
          ))}
        </div>

        {assignedCats.length > 0 && (
          <Button variant="outline" onClick={() => removeCategory(assignedCats[assignedCats.length - 1].id)} className="w-full rounded-lg mb-4">
            Supprimer la catégorie
          </Button>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onClose}>Sauvegarder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
