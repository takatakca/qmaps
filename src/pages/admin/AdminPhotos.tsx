import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  url: string;
  created_at: string;
  business_id?: string;
  review_id?: string;
}

const AdminPhotos = () => {
  const [bizPhotos, setBizPhotos] = useState<Photo[]>([]);
  const [revPhotos, setRevPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: bp }, { data: rp }] = await Promise.all([
      supabase.from("business_photos").select("id,url,created_at,business_id").order("created_at", { ascending: false }).limit(60),
      supabase.from("review_photos").select("id,url,created_at,review_id").order("created_at", { ascending: false }).limit(60),
    ]);
    setBizPhotos((bp as Photo[]) || []);
    setRevPhotos((rp as Photo[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const del = async (table: "business_photos" | "review_photos", id: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Photo supprimée" }); void load(); }
  };

  const renderGrid = (photos: Photo[], table: "business_photos" | "review_photos") => (
    photos.length === 0 ? (
      <Card className="p-8 text-center"><p className="text-muted-foreground">Aucune photo.</p></Card>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map(p => (
          <Card key={p.id} className="overflow-hidden">
            <img src={p.url} alt="" className="w-full aspect-square object-cover" />
            <div className="p-2">
              <Button size="sm" variant="destructive" className="w-full" onClick={() => del(table, p.id)}>
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    )
  );

  return (
    <AdminLayout title="Photos">
      {loading ? <p className="text-muted-foreground">Chargement...</p> :
        <Tabs defaultValue="business">
          <TabsList>
            <TabsTrigger value="business">Entreprises ({bizPhotos.length})</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({revPhotos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="business" className="mt-4">{renderGrid(bizPhotos, "business_photos")}</TabsContent>
          <TabsContent value="reviews" className="mt-4">{renderGrid(revPhotos, "review_photos")}</TabsContent>
        </Tabs>
      }
    </AdminLayout>
  );
};

export default AdminPhotos;
