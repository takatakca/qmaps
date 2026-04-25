import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminReports, type ReportStatus, type ReportTargetType } from "@/hooks/useReports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_COLORS: Record<ReportStatus, string> = {
  open: "bg-destructive/10 text-destructive",
  reviewing: "bg-amber-500/10 text-amber-700",
  resolved: "bg-green-500/10 text-green-700",
  dismissed: "bg-muted text-muted-foreground",
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  business: "Entreprise",
  review: "Avis",
  business_photo: "Photo entreprise",
  review_photo: "Photo avis",
  user: "Utilisateur",
  project_request: "Projet",
  project_quote: "Devis",
  message: "Message",
};

const AdminReports = () => {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("open");
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | "all">("all");
  const { reports, loading, updateStatus } = useAdminReports({ status: statusFilter, target_type: typeFilter });
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const handleAction = async (id: string, status: ReportStatus, internalNote?: string) => {
    try {
      await updateStatus(id, status, internalNote);
      toast({ title: "Signalement mis à jour" });
      setOpenId(null);
      setNote("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Signalements">
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="reviewing">En cours</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="dismissed">Rejetés</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TARGET_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun signalement.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                    <Badge variant="outline">{TARGET_LABELS[r.target_type]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="font-medium mt-2">Motif : {r.reason}</p>
                  {r.details && <p className="text-sm text-muted-foreground mt-1">{r.details}</p>}
                  <p className="text-xs text-muted-foreground mt-2 font-mono">Cible : {r.target_id}</p>
                  {r.internal_note && (
                    <p className="text-xs mt-2 p-2 bg-muted rounded">Note : {r.internal_note}</p>
                  )}
                </div>
              </div>

              {openId === r.id ? (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs">Note interne (facultatif)</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "reviewing", note)}>En cours</Button>
                    <Button size="sm" onClick={() => handleAction(r.id, "resolved", note)}>Résolu</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAction(r.id, "dismissed", note)}>Rejeter</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setOpenId(null); setNote(""); }}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => { setOpenId(r.id); setNote(r.internal_note || ""); }}>
                    Modérer
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
