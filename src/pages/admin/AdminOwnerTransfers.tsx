import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, X } from "lucide-react";
import { buildAdminAuditLogPayload } from "@/lib/adminAudit";
import { OWNER_TRANSFER_STATUS_LABELS, type OwnerTransferStatus } from "@/lib/ownerTransfers";

interface TransferRow {
  id: string;
  business_id: string;
  claim_request_id: string | null;
  current_owner_user_id: string | null;
  requested_owner_user_id: string;
  status: OwnerTransferStatus;
  reason: string | null;
  admin_note: string | null;
  created_at: string;
  business?: { name: string; city: string | null } | null;
}

const AdminOwnerTransfers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OwnerTransferStatus | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("business_owner_transfer_requests")
      .select("*, business:business_id(name,city)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as TransferRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [filter]);

  const decide = async (row: TransferRow, decision: "approved" | "rejected") => {
    if (!user) return;
    if (!confirm(decision === "approved" ? "Approuver le transfert?" : "Rejeter le transfert?")) return;
    setWorking(row.id);
    const adminNote = (notes[row.id] ?? row.admin_note ?? "").trim() || null;

    const { error } = await (supabase as any)
      .from("business_owner_transfer_requests")
      .update({
        status: decision,
        admin_note: adminNote,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      setWorking(null);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    if (decision === "approved") {
      const { error: bizErr } = await supabase
        .from("businesses")
        .update({ owner_user_id: row.requested_owner_user_id, is_claimed: true })
        .eq("id", row.business_id);
      if (bizErr) {
        toast({ title: "Avertissement", description: `Mise à jour commerce: ${bizErr.message}`, variant: "destructive" });
      }
    }

    const action = decision === "approved" ? "owner_transfer_approved" : "owner_transfer_rejected";
    const auditPayload = buildAdminAuditLogPayload({
      adminUserId: user.id,
      action,
      targetType: "business_owner_transfer_request",
      targetId: row.id,
      metadata: {
        business_id: row.business_id,
        requested_owner_user_id: row.requested_owner_user_id,
        previous_owner_user_id: row.current_owner_user_id,
      },
    });
    const { error: auditErr } = await (supabase as any).from("admin_audit_logs").insert(auditPayload);
    if (auditErr) toast({ title: "Avertissement audit", description: auditErr.message, variant: "destructive" });

    setWorking(null);
    toast({ title: decision === "approved" ? "Transfert approuvé" : "Transfert rejeté" });
    await load();
  };

  return (
    <AdminLayout title="Transferts de propriété">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >
            {f === "all" ? "Tous" : OWNER_TRANSFER_STATUS_LABELS[f as OwnerTransferStatus]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Aucune demande.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.business?.name ?? row.business_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.business?.city ?? ""} · {new Date(row.created_at).toLocaleDateString("fr-CA")}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-secondary">
                  {OWNER_TRANSFER_STATUS_LABELS[row.status]}
                </span>
              </div>

              <div className="text-xs space-y-1 text-muted-foreground font-mono">
                <p>Propriétaire actuel: {row.current_owner_user_id ?? "—"}</p>
                <p>Nouveau propriétaire: {row.requested_owner_user_id}</p>
                {row.claim_request_id && <p>Lié à revendication: {row.claim_request_id}</p>}
              </div>
              {row.reason && <p className="text-sm italic">"{row.reason}"</p>}

              {row.status === "pending" ? (
                <>
                  <Textarea
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                    placeholder="Note admin (facultatif)…"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => decide(row, "rejected")} disabled={working === row.id}>
                      {working === row.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <X size={12} className="mr-1" />}
                      Rejeter
                    </Button>
                    <Button size="sm" onClick={() => decide(row, "approved")} disabled={working === row.id}>
                      {working === row.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <Check size={12} className="mr-1" />}
                      Approuver
                    </Button>
                  </div>
                </>
              ) : row.admin_note ? (
                <p className="text-xs text-muted-foreground border-t pt-2">Note: {row.admin_note}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOwnerTransfers;
