import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectRequest {
  id: string;
  title: string;
  status: string;
  city: string | null;
  urgency: string;
  created_at: string;
  user_id: string;
}

const AdminProjects = () => {
  const [items, setItems] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("project_requests")
      .select("id,title,status,city,urgency,created_at,user_id")
      .order("created_at", { ascending: false }).limit(100);
    setItems((data as ProjectRequest[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminLayout title="Projets">
      {loading ? <p className="text-muted-foreground">Chargement...</p> :
        items.length === 0 ? <Card className="p-8 text-center"><p className="text-muted-foreground">Aucun projet.</p></Card> :
        <div className="space-y-3">
          {items.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.city || "—"} · {p.urgency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{p.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </AdminLayout>
  );
};

export default AdminProjects;
