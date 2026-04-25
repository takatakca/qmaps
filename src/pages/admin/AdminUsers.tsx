import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles")
      .select("id,display_name,avatar_url,email,created_at")
      .order("created_at", { ascending: false }).limit(100);
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminLayout title="Utilisateurs">
      {loading ? <p className="text-muted-foreground">Chargement...</p> :
        users.length === 0 ? <Card className="p-8 text-center"><p className="text-muted-foreground">Aucun utilisateur.</p></Card> :
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id} className="p-3 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.avatar_url || undefined} />
                <AvatarFallback>{(u.display_name || u.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.display_name || "Sans nom"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email || "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: fr })}
              </span>
            </Card>
          ))}
        </div>
      }
    </AdminLayout>
  );
};

export default AdminUsers;
