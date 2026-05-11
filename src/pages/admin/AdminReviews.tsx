import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "@/components/StarRating";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { buildAdminAuditLogPayload, type AdminAuditAction } from "@/lib/adminAudit";
import { getReviewModerationSignals, scoreModerationSignals } from "@/lib/moderationSignals";

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  business_id: string;
  user_id: string;
  moderation_status?: string | null;
  hidden_reason?: string | null;
}

const STATUS_OPTIONS = ["all", "visible", "hidden"] as const;

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("reviews")
      .select("id,rating,body,created_at,business_id,user_id,moderation_status,hidden_reason")
      .order("created_at", { ascending: false }).limit(150);
    if (statusFilter !== "all") q = q.eq("moderation_status", statusFilter);
    const { data } = await q;
    setReviews((data as Review[]) || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const audit = async (action: AdminAuditAction, targetId: string, metadata: Record<string, unknown> = {}) => {
    if (!user) return;
    await (supabase as any).from("admin_audit_logs").insert(
      buildAdminAuditLogPayload({ adminUserId: user.id, action, targetType: "review", targetId, metadata }),
    );
  };

  const setStatus = async (r: Review, next: "visible" | "hidden", reason?: string) => {
    const updates: Record<string, unknown> = { moderation_status: next };
    if (next === "hidden") {
      updates.hidden_at = new Date().toISOString();
      updates.hidden_by = user?.id ?? null;
      updates.hidden_reason = reason ?? null;
    } else {
      updates.hidden_at = null; updates.hidden_by = null; updates.hidden_reason = null;
    }
    const { error } = await supabase.from("reviews").update(updates as any).eq("id", r.id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    await audit(next === "hidden" ? "review_hidden" : "review_restored", r.id, { reason: reason ?? null });
    toast({ title: next === "hidden" ? "Avis masqué" : "Avis restauré" });
    void load();
  };

  const markReviewed = async (r: Review) => {
    await audit("review_reviewed", r.id, {});
    toast({ title: "Avis marqué comme vérifié" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Avis supprimé" }); void load(); }
  };

  const filtered = reviews.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.body ?? "").toLowerCase().includes(q) || r.business_id.includes(q);
  });

  return (
    <AdminLayout title="Avis">
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "Tous" : s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="flex-1 min-w-[200px]" />
      </div>

      {loading ? <p className="text-muted-foreground">Chargement...</p> :
        filtered.length === 0 ? <Card className="p-8 text-center"><p className="text-muted-foreground">Aucun avis.</p></Card> :
        <div className="space-y-3">
          {filtered.map(r => {
            const signals = getReviewModerationSignals(r);
            const { level } = scoreModerationSignals(signals);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={r.rating} size={14} />
                    <Badge variant="outline">{r.moderation_status ?? "visible"}</Badge>
                    {signals.length > 0 && (
                      <Badge variant={level === "high" ? "destructive" : "secondary"}>
                        {signals.length} signal{signals.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {r.moderation_status === "hidden" ? (
                      <Button size="sm" variant="secondary" onClick={() => setStatus(r, "visible")}>Restaurer</Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => {
                        const reason = prompt("Raison du masquage ?");
                        if (reason && reason.trim()) void setStatus(r, "hidden", reason.trim());
                      }}>Masquer</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => markReviewed(r)}>Marquer vérifié</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>Supprimer</Button>
                  </div>
                </div>
                {r.body && <p className="mt-2 text-sm whitespace-pre-wrap">{r.body}</p>}
                {r.hidden_reason && <p className="text-xs text-destructive mt-1">Masqué : {r.hidden_reason}</p>}
                {signals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {signals.map((s) => (
                      <Badge key={s.id} variant={s.severity === "high" ? "destructive" : "outline"} className="text-[10px]">
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2 font-mono">Entreprise : {r.business_id}</p>
              </Card>
            );
          })}
        </div>
      }
    </AdminLayout>
  );
};

export default AdminReviews;
