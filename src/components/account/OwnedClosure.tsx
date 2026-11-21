import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ownedApi } from "@/lib/ownedApi";
import {
  DELETE_CONFIRMATION_TOKEN,
  STATUS_LABELS_FR,
  isDeletionConfirmationValid,
  type AccountDeletionStatus,
} from "@/lib/accountDeletion";

type Closure = {
  id: string;
  status: AccountDeletionStatus;
  requested_at: string;
};

export function OwnedClosure({ userId }: { userId: string }) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["qmaps-closure", userId],
    queryFn: () => ownedApi<{ request: Closure | null }>("me/closure"),
  });
  async function change(method: "POST" | "DELETE") {
    setBusy(true);
    setError("");
    try {
      await ownedApi(
        "me/closure",
        method,
        method === "POST" ? { confirmation: confirmation.trim() } : undefined,
      );
      setConfirmation("");
      await query.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demande impossible");
    } finally {
      setBusy(false);
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (isDeletionConfirmationValid(confirmation)) void change("POST");
  };
  if (query.isPending) return <p>Chargement de la demande…</p>;
  if (query.isError)
    return (
      <p role="alert">
        {query.error.message}{" "}
        <Button onClick={() => void query.refetch()}>Réessayer</Button>
      </p>
    );
  const item = query.data.request;
  return (
    <section className="space-y-4">
      {item && (
        <p role="status">
          Demande du {new Date(item.requested_at).toLocaleDateString("fr-CA")} ·{" "}
          {STATUS_LABELS_FR[item.status]}
        </p>
      )}
      {item?.status === "pending" ? (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void change("DELETE")}
        >
          Annuler ma demande
        </Button>
      ) : item?.status === "processing" ? (
        <p>Votre demande est en traitement.</p>
      ) : (
        <form className="space-y-3" onSubmit={submit}>
          <Label htmlFor="confirm-closure">
            Saisissez {DELETE_CONFIRMATION_TOKEN} pour demander la suppression
            du compte.
          </Label>
          <Input
            autoComplete="off"
            id="confirm-closure"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <Button
            variant="destructive"
            disabled={busy || !isDeletionConfirmationValid(confirmation)}
          >
            Demander la suppression de mon compte
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

export function ClosureQueue({ userId }: { userId: string }) {
  const list = useQuery({
    queryKey: ["qmaps-owner-closures", userId],
    queryFn: () =>
      ownedApi<(Closure & { user_id: string })[]>("console/closures"),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCase, setConfirmCase] = useState("");
  async function process(id: string, operation: "start" | "finish") {
    setBusy(true);
    setError("");
    try {
      await ownedApi(
        "console/closures/" + id + "/" + operation,
        "POST",
        operation === "finish" ? { confirmation: confirmCase } : undefined,
      );
      setConfirmCase("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible");
    } finally {
      await list.refetch();
      setBusy(false);
    }
  }
  return (
    <section className="space-y-2">
      <h3 className="text-xl font-semibold">Demandes de fermeture</h3>
      {list.isPending ? (
        <p>Chargement…</p>
      ) : list.isError ? (
        <p role="alert">{list.error.message}</p>
      ) : list.data.length === 0 ? (
        <p>Aucune demande en attente de traitement.</p>
      ) : (
        <ul>
          {list.data.map((r) => (
            <li key={r.id} className="space-y-1 rounded border p-3">
              <p>Compte {r.user_id}</p>
              <p>
                {new Date(r.requested_at).toLocaleDateString("fr-CA")} ·{" "}
                {STATUS_LABELS_FR[r.status]}
              </p>
              {r.status === "pending" && (
                <Button
                  disabled={busy}
                  onClick={() => void process(r.id, "start")}
                >
                  Prendre en charge
                </Button>
              )}
              {r.status === "processing" && (
                <details>
                  <summary>Terminer la fermeture</summary>
                  <p>
                    Après vérification des données à conserver et des droits du
                    commerce, saisissez le numéro de demande {r.id} pour
                    supprimer définitivement les accès et les données privées.
                  </p>
                  <Input
                    aria-label="Numéro de demande vérifié"
                    value={confirmCase}
                    onChange={(e) => setConfirmCase(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    disabled={busy || confirmCase !== r.id}
                    onClick={() => void process(r.id, "finish")}
                  >
                    Fermer définitivement le compte
                  </Button>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
