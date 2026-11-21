import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ownedApi } from "@/lib/ownedApi";

export function PublicationTerms({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ["publication-terms", userId],
    queryFn: () =>
      ownedApi<{ version: string; accepted: boolean }>("me/publication-terms"),
    retry: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function accept() {
    if (!query.data) return;
    setBusy(true);
    setError("");
    try {
      await ownedApi("me/publication-terms", "PUT", {
        version: query.data.version,
      });
      await query.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }
  if (query.data?.accepted || query.isPending) return null;
  return (
    <section className="space-y-2 rounded-lg border p-4">
      {query.error ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <>
          <a
            className="underline"
            href="/terms"
            target="_blank"
            rel="noreferrer"
          >
            Lire les conditions de publication QMAPS
          </a>
          <div>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void accept()}
            >
              J’accepte les conditions de publication
            </Button>
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
type Report = {
  id: string;
  target_type: "user" | "business";
  target_id: string;
  details: string;
  created_at: string;
};
export function PublisherModeration({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ["listing-reports", userId],
    queryFn: () => ownedApi<Report[]>("console/listing-reports"),
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState("");
  async function decide(id: string, action: "hide" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      await ownedApi("console/listing-reports/" + id + "/" + action, "POST");
      setConfirm("");
      await query.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traitement impossible");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-2">
      <h3 className="text-xl font-semibold">
        Signalements des fiches et des éditeurs
      </h3>
      {query.isPending ? (
        <p>Chargement…</p>
      ) : query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : query.data.length === 0 ? (
        <p>Aucun signalement ouvert.</p>
      ) : (
        <ul className="space-y-2">
          {query.data.map((r) => (
            <li key={r.id} className="space-y-2 rounded border p-3">
              <p>
                {r.target_type === "business" ? "Fiche" : "Éditeur"} ·{" "}
                {r.target_id}
              </p>
              <p>{r.details}</p>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void decide(r.id, "dismiss")}
              >
                Classer sans action
              </Button>
              {confirm === r.id ? (
                <>
                  <p>
                    {r.target_type === "user"
                      ? "Les fiches de cet éditeur seront masquées et ses publications suspendues."
                      : "La fiche sera retirée du catalogue."}
                  </p>
                  <Button
                    disabled={busy}
                    variant="destructive"
                    onClick={() => void decide(r.id, "hide")}
                  >
                    Confirmer
                  </Button>
                  <Button variant="outline" onClick={() => setConfirm("")}>
                    Annuler
                  </Button>
                </>
              ) : (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => setConfirm(r.id)}
                >
                  {r.target_type === "business"
                    ? "Masquer la fiche"
                    : "Suspendre les publications"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
