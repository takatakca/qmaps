import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Check, X, Loader2, ExternalLink } from "lucide-react";
import { buildAdminAuditLogPayload } from "@/lib/adminAudit";
import { buildOwnerTransferRequest } from "@/lib/ownerTransfers";

interface ClaimRequestRow {
  id: string;
  business_id: string;
  user_id: string;
  status: string;
  contact_name: string;
  business_email: string;
  business_phone: string | null;
  message: string | null;
  evidence_url: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  business?: { name: string; city: string | null; is_claimed: boolean; owner_user_id: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

const AdminClaims = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<ClaimRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("business_claim_requests")
      .select("*, business:business_id(name,city,is_claimed,owner_user_id)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as ClaimRequestRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [filter]);

  const decide = async (row: ClaimRequestRow, decision: "approved" | "rejected") => {
    if (!user) return;
    if (!confirm(decision === "approved" ? "Approuver cette revendication?" : "Rejeter cette revendication?")) return;

    setWorking(row.id);
    const adminNote = (notes[row.id] ?? row.admin_note ?? "").trim() || null;

    const { error } = await (supabase as any)
      .from("business_claim_requests")
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

    let transferred = false;
    let transferRequested = false;

    if (decision === "approved" && row.business) {
      const existingOwner = row.business.owner_user_id;
      if (!existingOwner || existingOwner === row.user_id) {
        const update: Record<string, unknown> = { is_claimed: true };
        if (!existingOwner) update.owner_user_id = row.user_id;
        const { error: bizErr } = await supabase.from("businesses").update(update).eq("id", row.business_id);
        if (bizErr) {
          setWorking(null);
          toast({ title: "Erreur (commerce)", description: bizErr.message, variant: "destructive" });
          return;
        }
        transferred = !existingOwner;
      } else {
        // Different existing owner — create a transfer request for review
        try {
          const payload = buildOwnerTransferRequest({
            businessId: row.business_id,
            requestedOwnerUserId: row.user_id,
            currentOwnerUserId: existingOwner,
            claimRequestId: row.id,
            reason: adminNote ?? undefined,
          });
          const { error: trErr } = await (supabase as any)
            .from("business_owner_transfer_requests")
            .insert(payload);
          if (trErr) {
            toast({ title: "Avertissement transfert", description: trErr.message, variant: "destructive" });
          } else {
            transferRequested = true;
            const { error: auditErr } = await (supabase as any).from("admin_audit_logs").insert(
              buildAdminAuditLogPayload({
                adminUserId: user.id,
                action: "owner_transfer_requested",
                targetType: "business_owner_transfer_request",
                targetId: row.business_id,
                metadata: {
                  business_id: row.business_id,
                  claim_request_id: row.id,
                  current_owner_user_id: existingOwner,
                  requested_owner_user_id: row.user_id,
                },
              })
            );
            if (auditErr) toast({ title: "Avertissement audit", description: auditErr.message, variant: "destructive" });
          }
        } catch (e: any) {
          toast({ title: "Avertissement transfert", description: e.message, variant: "destructive" });
        }
      }
    }

    // Audit log for the claim decision
    const auditPayload = buildAdminAuditLogPayload({
      adminUserId: user.id,
      action: decision === "approved" ? "claim_approved" : "claim_rejected",
      targetType: "business_claim_request",
      targetId: row.id,
      metadata: {
        business_id: row.business_id,
        claimant_user_id: row.user_id,
        ownership_transferred: transferred,
        transfer_request_created: transferRequested,
        admin_note: adminNote,
      },
    });
    const { error: auditErr } = await (supabase as any).from("admin_audit_logs").insert(auditPayload);
    if (auditErr) {
      toast({ title: "Avertissement audit", description: auditErr.message, variant: "destructive" });
    }

    setWorking(null);
    toast({
      title: decision === "approved"
        ? transferRequested
          ? "Demande approuvée, transfert propriétaire créé pour révision."
          : "Revendication approuvée"
        : "Revendication rejetée",
    });
    await load();
  };

  return (
    <AdminLayout title="Revendications de commerces">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >
            {f === "all" ? "Toutes" : STATUS_LABEL[f]}
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
                  <p className="font-semibold text-foreground">{row.business?.name ?? row.business_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.business?.city ?? ""} · {new Date(row.created_at).toLocaleDateString("fr-CA")}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </div>

              <div className="text-sm text-foreground space-y-1">
                <p><span className="text-muted-foreground">Contact:</span> {row.contact_name}</p>
                <p><span className="text-muted-foreground">Courriel:</span> {row.business_email}</p>
                {row.business_phone && <p><span className="text-muted-foreground">Téléphone:</span> {row.business_phone}</p>}
                {row.message && <p className="text-muted-foreground italic">"{row.message}"</p>}
                {row.evidence_url && (
                  <a href={row.evidence_url} target="_blank" rel="noreferrer" className="text-primary text-xs inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Preuve
                  </a>
                )}
              </div>

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

export default AdminClaims;
