import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminReviewModeration } from "@/hooks/useAdminReviewModeration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
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

interface AuditRow {
  id: string;
  action: string;
  reason: string | null;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
}

const AdminReviewModeration = () => {
  const [riskLevel, setRiskLevel] = useState<ReviewRiskLevel | "all">("all");
  const [status, setStatus] = useState<ReviewModerationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const { items, loading, updateStatus, recompute, addNote } = useAdminReviewModeration({
    riskLevel,
    status,
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [audit, setAudit] = useState<Record<string, AuditRow[]>>({});

  // Hide-reason dialog state
  const [hideTarget, setHideTarget] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      return (
        (it.review.body ?? "").toLowerCase().includes(q) ||
        (it.business?.name ?? "").toLowerCase().includes(q) ||
        (it.business?.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  // Lazy-load audit history per review when items change
  useEffect(() => {
    if (filtered.length === 0) return;
    let cancelled = false;
    void (async () => {
      const ids = filtered.map((f) => f.review.id);
      const { data } = await supabase
        .from("review_moderation_actions" as any)
        .select("id, review_id, action, reason, previous_status, new_status, created_at")
        .in("review_id", ids)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const map: Record<string, AuditRow[]> = {};
      for (const row of (data ?? []) as any[]) {
        if (!map[row.review_id]) map[row.review_id] = [];
        map[row.review_id].push(row);
      }
      setAudit(map);
    })();
    return () => { cancelled = true; };
  }, [filtered.map((f) => f.review.id).join(",")]);

  const confirmHide = async () => {
    if (!hideTarget) return;
    const reason = hideReason.trim();
    if (!reason) return;
    await updateStatus(hideTarget, "hidden", "hide_review", reason);
    setHideTarget(null);
    setHideReason("");
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    await updateStatus(restoreTarget, "restored", "restore_review");
    setRestoreTarget(null);
  };

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
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher commerce ou texte d'avis…"
          className="flex-1 min-w-[220px]"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">Aucun avis flaggé</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search.trim()
              ? "Aucun résultat pour cette recherche."
              : "Tous les avis correspondant aux filtres sont propres."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(({ trust, review, business, user, signals }) => (
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

              {audit[review.id] && audit[review.id].length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Historique de modération</p>
                  <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                    {audit[review.id].map((a) => (
                      <li key={a.id} className="text-muted-foreground">
                        <span className="font-mono text-[10px]">
                          {new Date(a.created_at).toLocaleString("fr-CA")}
                        </span>{" "}
                        · <span className="font-medium text-foreground">{a.action}</span>
                        {a.previous_status && a.new_status ? ` (${a.previous_status} → ${a.new_status})` : ""}
                        {a.reason ? ` — ${a.reason}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "trusted", "mark_trusted")}>Marquer fiable</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "needs_review", "mark_needs_review")}>À revoir</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(review.id, "dismissed", "dismiss_flags")}>Ignorer signaux</Button>
                <Button size="sm" variant="destructive" onClick={() => { setHideTarget(review.id); setHideReason(""); }}>Masquer</Button>
                <Button size="sm" variant="secondary" onClick={() => setRestoreTarget(review.id)}>Restaurer</Button>
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

      {/* Hide review confirmation — requires reason */}
      <AlertDialog open={!!hideTarget} onOpenChange={(o) => { if (!o) setHideTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masquer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retire l'avis de l'affichage public. L'auteur peut toujours le voir.
              Une raison est obligatoire et sera enregistrée dans l'historique d'audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="Raison du masquage (obligatoire)…"
            rows={3}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={!hideReason.trim()}
              onClick={(e) => { e.preventDefault(); void confirmHide(); }}
            >
              Masquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => { if (!o) setRestoreTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'avis redeviendra public. L'action sera enregistrée dans l'historique d'audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void confirmRestore(); }}>
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReviewModeration;
