import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ACCOUNT_DELETION_STATUSES,
  STATUS_LABELS_FR,
  type AccountDeletionStatus,
} from "@/lib/accountDeletion";

interface DeletionRequest {
  id: string;
  user_id: string;
  status: AccountDeletionStatus;
  reason: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  internal_note: string | null;
}

const STATUS_VARIANT: Record<AccountDeletionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  processing: "secondary",
  completed: "outline",
  canceled: "outline",
  rejected: "destructive",
};

const AdminAccountDeletions = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setRequests((data || []) as DeletionRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, newStatus: AccountDeletionStatus) => {
    if (!user) return;
    setBusyId(id);
    const note = notes[id]?.trim() || null;
    const patch: Partial<DeletionRequest> = {
      status: newStatus,
      processed_at: newStatus === "pending" ? null : new Date().toISOString(),
      processed_by: newStatus === "pending" ? null : user.id,
    };
    if (note) patch.internal_note = note;
    const { error } = await supabase
      .from("account_deletion_requests")
      .update(patch)
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast({ title: "Échec", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mis à jour", description: `Statut : ${STATUS_LABELS_FR[newStatus]}` });
    fetchRequests();
  };

  return (
    <AdminLayout title="Suppressions de compte">
      <div className="space-y-4">
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            Toutes les actions sont enregistrées de manière auditable. La suppression effective
            des comptes Supabase Auth doit être effectuée hors interface (script ou support).
            Cette page sert au suivi et au statut des demandes uniquement.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin" size={16} /> Chargement…
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      Utilisateur : {req.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Demandée le {new Date(req.requested_at).toLocaleString("fr-CA")}
                    </p>
                    {req.processed_at && (
                      <p className="text-xs text-muted-foreground">
                        Traitée le {new Date(req.processed_at).toLocaleString("fr-CA")}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[req.status]}>
                    {STATUS_LABELS_FR[req.status]}
                  </Badge>
                </div>

                {req.reason && (
                  <div className="bg-muted/40 rounded-md p-2 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Raison de l'utilisateur :</p>
                    <p className="text-foreground">{req.reason}</p>
                  </div>
                )}

                {req.internal_note && (
                  <div className="bg-accent/30 rounded-md p-2 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Note interne actuelle :</p>
                    <p className="text-foreground">{req.internal_note}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Textarea
                    value={notes[req.id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                    placeholder="Note interne (optionnel)…"
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    {ACCOUNT_DELETION_STATUSES.filter((s) => s !== req.status).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === "rejected" ? "destructive" : s === "completed" ? "default" : "outline"}
                        disabled={busyId === req.id}
                        onClick={() => updateStatus(req.id, s)}
                      >
                        {STATUS_LABELS_FR[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAccountDeletions;
