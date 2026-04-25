import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";
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

interface DeletionEvent {
  id: string;
  request_id: string;
  actor_user_id: string | null;
  event_type: "created" | "status_changed" | "note_added";
  previous_status: AccountDeletionStatus | null;
  new_status: AccountDeletionStatus | null;
  note: string | null;
  created_at: string;
}

const STATUS_VARIANT: Record<AccountDeletionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  processing: "secondary",
  completed: "outline",
  canceled: "outline",
  rejected: "destructive",
};

const EVENT_LABEL: Record<DeletionEvent["event_type"], string> = {
  created: "Créée",
  status_changed: "Statut modifié",
  note_added: "Note ajoutée",
};

const AdminAccountDeletions = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [events, setEvents] = useState<Record<string, DeletionEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const reqs = (data || []) as DeletionRequest[];
    setRequests(reqs);

    if (reqs.length > 0) {
      const { data: evData } = await supabase
        .from("account_deletion_request_events")
        .select("*")
        .in("request_id", reqs.map((r) => r.id))
        .order("created_at", { ascending: false });
      const grouped: Record<string, DeletionEvent[]> = {};
      for (const ev of (evData || []) as DeletionEvent[]) {
        (grouped[ev.request_id] ||= []).push(ev);
      }
      setEvents(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (req: DeletionRequest, newStatus: AccountDeletionStatus) => {
    if (!user) return;
    setBusyId(req.id);
    const note = notes[req.id]?.trim() || null;
    const patch: Partial<DeletionRequest> = {
      status: newStatus,
      processed_at: newStatus === "pending" ? null : new Date().toISOString(),
      processed_by: newStatus === "pending" ? null : user.id,
    };
    if (note) patch.internal_note = note;

    const { error } = await supabase
      .from("account_deletion_requests")
      .update(patch)
      .eq("id", req.id);

    if (error) {
      setBusyId(null);
      toast({ title: "Échec", description: error.message, variant: "destructive" });
      return;
    }

    // Insert audit event for status change
    await supabase.from("account_deletion_request_events").insert({
      request_id: req.id,
      actor_user_id: user.id,
      event_type: "status_changed",
      previous_status: req.status,
      new_status: newStatus,
      note,
    });

    setNotes((prev) => ({ ...prev, [req.id]: "" }));
    setBusyId(null);
    toast({ title: "Mis à jour", description: `Statut : ${STATUS_LABELS_FR[newStatus]}` });
    fetchRequests();
  };

  const addNoteOnly = async (req: DeletionRequest) => {
    if (!user) return;
    const note = notes[req.id]?.trim();
    if (!note) {
      toast({ title: "Note vide", description: "Saisissez une note avant d'enregistrer.", variant: "destructive" });
      return;
    }
    setBusyId(req.id);
    const { error } = await supabase
      .from("account_deletion_requests")
      .update({ internal_note: note })
      .eq("id", req.id);
    if (error) {
      setBusyId(null);
      toast({ title: "Échec", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("account_deletion_request_events").insert({
      request_id: req.id,
      actor_user_id: user.id,
      event_type: "note_added",
      previous_status: req.status,
      new_status: req.status,
      note,
    });
    setNotes((prev) => ({ ...prev, [req.id]: "" }));
    setBusyId(null);
    toast({ title: "Note ajoutée" });
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
            {requests.map((req) => {
              const reqEvents = events[req.id] || [];
              const isOpen = expandedHistory[req.id];
              return (
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
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === req.id}
                        onClick={() => addNoteOnly(req)}
                      >
                        Ajouter note seulement
                      </Button>
                      {ACCOUNT_DELETION_STATUSES.filter((s) => s !== req.status).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === "rejected" ? "destructive" : s === "completed" ? "default" : "outline"}
                          disabled={busyId === req.id}
                          onClick={() => updateStatus(req, s)}
                        >
                          {STATUS_LABELS_FR[s]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedHistory((prev) => ({ ...prev, [req.id]: !prev[req.id] }))
                    }
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <History size={14} />
                    {isOpen ? "Masquer" : "Afficher"} l'historique ({reqEvents.length})
                  </button>

                  {isOpen && (
                    <div className="border-t border-border pt-3 space-y-2">
                      {reqEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucun événement enregistré.</p>
                      ) : (
                        reqEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="text-xs bg-muted/30 rounded-md p-2 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {EVENT_LABEL[ev.event_type]}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(ev.created_at).toLocaleString("fr-CA")}
                              </span>
                            </div>
                            {ev.previous_status && ev.new_status && ev.previous_status !== ev.new_status && (
                              <p className="text-muted-foreground">
                                {STATUS_LABELS_FR[ev.previous_status]} → {STATUS_LABELS_FR[ev.new_status]}
                              </p>
                            )}
                            {ev.note && <p className="text-foreground">{ev.note}</p>}
                            {ev.actor_user_id && (
                              <p className="font-mono text-[10px] text-muted-foreground truncate">
                                Acteur : {ev.actor_user_id}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAccountDeletions;
