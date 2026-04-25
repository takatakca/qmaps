import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Business {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
  is_claimed: boolean;
  owner_user_id: string | null;
  created_at: string;
}

interface Claim {
  id: string;
  business_id: string;
  user_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: biz }, { data: cl }] = await Promise.all([
      supabase.from("businesses").select("id,name,city,is_active,is_claimed,owner_user_id,created_at")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("business_claims").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setBusinesses((biz as Business[]) || []);
    setClaims((cl as Claim[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("businesses").update({ is_active: !current }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: current ? "Désactivée" : "Réactivée" }); void load(); }
  };

  const approveClaim = async (claim: Claim) => {
    const { error: bizErr } = await supabase.from("businesses")
      .update({ owner_user_id: claim.user_id, is_claimed: true })
      .eq("id", claim.business_id);
    if (bizErr) { toast({ title: "Erreur", description: bizErr.message, variant: "destructive" }); return; }

    const { error: clErr } = await supabase.from("business_claims")
      .update({ status: "approved" }).eq("id", claim.id);
    if (clErr) { toast({ title: "Erreur claim", description: clErr.message, variant: "destructive" }); return; }

    await supabase.from("user_roles").insert({ user_id: claim.user_id, role: "merchant" as any });

    toast({ title: "Réclamation approuvée" });
    void load();
  };

  const rejectClaim = async (claim: Claim) => {
    const { error } = await supabase.from("business_claims").update({ status: "rejected" }).eq("id", claim.id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Réclamation rejetée" }); void load(); }
  };

  return (
    <AdminLayout title="Entreprises">
      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">Entreprises</TabsTrigger>
          <TabsTrigger value="claims">Réclamations ({claims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-3 mt-4">
          {loading ? <p className="text-muted-foreground">Chargement...</p> :
            businesses.length === 0 ? <Card className="p-8 text-center"><p className="text-muted-foreground">Aucune entreprise.</p></Card> :
            businesses.map(b => (
              <Card key={b.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{b.name}</p>
                    {!b.is_active && <Badge variant="destructive">Désactivée</Badge>}
                    {b.is_claimed && <Badge variant="outline">Revendiquée</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{b.city}</p>
                </div>
                <Button size="sm" variant={b.is_active ? "outline" : "default"} onClick={() => toggleActive(b.id, b.is_active)}>
                  {b.is_active ? "Désactiver" : "Réactiver"}
                </Button>
              </Card>
            ))
          }
        </TabsContent>

        <TabsContent value="claims" className="space-y-3 mt-4">
          {claims.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Aucune réclamation en attente.</p></Card>
          ) : claims.map(c => (
            <Card key={c.id} className="p-4">
              <p className="text-sm">Entreprise : <span className="font-mono text-xs">{c.business_id}</span></p>
              <p className="text-sm">Utilisateur : <span className="font-mono text-xs">{c.user_id}</span></p>
              {c.note && <p className="text-sm mt-2 p-2 bg-muted rounded">{c.note}</p>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => approveClaim(c)}>Approuver</Button>
                <Button size="sm" variant="outline" onClick={() => rejectClaim(c)}>Rejeter</Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminBusinesses;
