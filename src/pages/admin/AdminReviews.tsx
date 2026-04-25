import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/StarRating";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  business_id: string;
  user_id: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews")
      .select("id,rating,body,created_at,business_id,user_id")
      .order("created_at", { ascending: false }).limit(100);
    setReviews((data as Review[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet avis ?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Avis supprimé" }); void load(); }
  };

  return (
    <AdminLayout title="Avis">
      {loading ? <p className="text-muted-foreground">Chargement...</p> :
        reviews.length === 0 ? <Card className="p-8 text-center"><p className="text-muted-foreground">Aucun avis.</p></Card> :
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating} size={14} />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>Supprimer</Button>
              </div>
              {r.body && <p className="mt-2 text-sm">{r.body}</p>}
              <p className="text-xs text-muted-foreground mt-2 font-mono">Entreprise : {r.business_id}</p>
            </Card>
          ))}
        </div>
      }
    </AdminLayout>
  );
};

export default AdminReviews;
