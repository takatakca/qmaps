import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ownedApi } from "@/lib/ownedApi";

type Report = { id: string; name: string; reports: number };
export default function PhotoModeration({ userId }: { userId: string }) {
  const reports = useQuery({
    queryKey: ["qmaps-photo-reports", userId],
    queryFn: () => ownedApi<Report[]>("console/photo-reports"),
    retry: false,
  });
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  async function resolve(id: string, decision: "dismiss" | "remove") {
    setBusy(true);
    try {
      await ownedApi("console/photo-reports/" + id + "/" + decision, "POST");
      await reports.refetch();
      setNote(decision === "remove" ? "Photo retirée" : "Signalement classé");
      setConfirm(null);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-2">
      <h3 className="text-xl font-semibold">Photos signalées</h3>
      {reports.isPending ? (
        <p>Chargement…</p>
      ) : reports.isError ? (
        <p role="alert">{reports.error.message}</p>
      ) : !reports.data.length ? (
        <p>Aucun signalement en attente.</p>
      ) : (
        reports.data.map((row) => (
          <article key={row.id} className="space-y-2 rounded border p-3">
            <img
              className="max-h-40 rounded"
              src={"/api/v1/photos/" + row.id}
              alt={"Photo signalée de " + row.name}
            />
            <p>
              {row.name} · Signalements reçus ({row.reports})
            </p>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => void resolve(row.id, "dismiss")}
            >
              Conserver la photo
            </Button>
            {confirm === row.id ? (
              <>
                <Button
                  disabled={busy}
                  onClick={() => void resolve(row.id, "remove")}
                >
                  Confirmer le retrait
                </Button>
                <Button variant="outline" onClick={() => setConfirm(null)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => setConfirm(row.id)}
              >
                Retirer la photo
              </Button>
            )}
          </article>
        ))
      )}
      <p role="status">{note}</p>
    </section>
  );
}
