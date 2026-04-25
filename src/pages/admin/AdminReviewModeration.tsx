import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminReviewModeration } from "@/hooks/useAdminReviewModeration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRiskLevelAdmin,
  riskLevelTone,
  humanSignalType,
  type ReviewRiskLevel,
  type ReviewModerationStatus,
} from "@/lib/reviewTrust";

const riskOptions: Array<ReviewRiskLevel | "all"> = ["all", "low", "medium", "high", "critical"];
const statusOptions: Array<ReviewModerationStatus | "all"> = [
  "all", "visible", "needs_review", "hidden", "trusted", "dismissed", "restored",
];

const AdminReviewModeration = () => {
  const [riskLevel, setRiskLevel] = useState<ReviewRiskLevel | "all">("all");
  const [status, setStatus] = useState<ReviewModerationStatus | "all">("all");
  const { items, loading, updateStatus, recompute, addNote } = useAdminReviewModeration({
    riskLevel,
    status,
  });
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <AdminLayout title="Sécurité des avis">
      <div className="rounded-lg border border-border bg-card p-3 mb-4">
        <p className="text-xs text-muted-foreground">
          Le score de risque est une aide à la modération, pas une preuve. Ne supprimez pas
          un avis uniquement parce qu'il est négatif. Appuyez vos décisions sur des preuves
          et la politique de la plateforme.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as any)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Niveau de risque" /></SelectTrigger>
          <SelectContent>
            {riskOptions.map((r) => (<SelectItem key={r} value={r}>{r === "all" ? "Tous niveaux" : r}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (<SelectItem key={s} value={s}>{s === "all" ? "Tous statuts" : s}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun avis flaggé pour ces filtres.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(({ trust, review, business, user, signals }) => (
            <li key={review.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={riskLevelTone(trust?.risk_level ?? "low")}>
                      {formatRiskLevelAdmin(trust?.risk_level ?? "low")} · {Math.round(Number(trust?.risk_score ?? 0))}
                    </Badge>
                    <Badge variant="outline">{trust?.status ?? "visible"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {business?.name ?? "—"} {business?.city ? `· ${business.city}` : ""}
                    </span>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap break-words">{review.body || <em className="text-muted-foreground">(aucun texte)</em>}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note {review.rating}/5 · {user?.display_name ?? review.user_id.slice(0, 8)}
                  </p>
                </div>
              </div>

              {signals.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Signaux</p>
                  <ul className="text-xs space-y-1">
                    {signals.map((s: any) => (
                      <li key={s.id}>
                        <span className="font-medium">{humanSignalType(s.signal_type)}</span>
                        <span className="text-muted-foreground"> · {s.severity} · {s.explanation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "trusted", "mark_trusted")}>Marquer fiable</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "needs_review", "mark_needs_review")}>À revoir</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "dismissed", "dismiss_flags")}>Ignorer signaux</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(review.id, "hidden", "hide_review")}>Masquer</Button>
                <Button size="sm" variant="secondary" onClick={() => updateStatus(review.id, "restored", "restore_review")}>Restaurer</Button>
                <Button size="sm" variant="outline" onClick={() => recompute(review.id)}>Recalculer</Button>
              </div>

              <div className="mt-3 flex gap-2">
                <Textarea
                  placeholder="Note interne…"
                  value={notes[review.id] ?? ""}
                  onChange={(e) => setNotes((m) => ({ ...m, [review.id]: e.target.value }))}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const v = notes[review.id]?.trim();
                    if (!v) return;
                    void addNote(review.id, v);
                    setNotes((m) => ({ ...m, [review.id]: "" }));
                  }}
                >
                  Ajouter
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
};

export default AdminReviewModeration;
