import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import OwnedBusinessPanel from "@/components/merchant/OwnedBusinessPanel";
import { supabase } from "@/integrations/supabase/client";
import {
  guestServices,
  guestDescription,
  statusLabel,
  changeGuestStatus,
  type GuestRequest,
} from "@/lib/guestRequests";
import { Button } from "@/components/ui/button";

function GuestDesk({
  businessId,
  userId,
}: {
  businessId: string;
  userId: string;
}) {
  const cache = useQueryClient();
  const [page, setPage] = useState(0);
  const settings = useQuery({
    queryKey: ["guest-services", businessId, userId],
    queryFn: () => guestServices(businessId),
  });
  const queue = useQuery({
    queryKey: ["guest-queue", businessId, userId, page],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_requests")
        .select("*")
        .eq("business_id", businessId)
        .in("status", ["pending", "accepted"])
        .order("created_at")
        .order("id")
        .range(page * 20, page * 20 + 20);
      if (error) throw error;
      return data;
    },
  });
  const config = useMutation({
    mutationFn: async (field: "reservations" | "waitlist") => {
      const table = supabase.from("guest_services");
      const values = { [field]: !settings.data?.[field] };
      const result = settings.data
        ? await table
            .update(values)
            .eq("business_id", businessId)
            .select("business_id")
            .single()
        : await table
            .insert({ business_id: businessId, ...values })
            .select("business_id")
            .single();
      if (result.error) throw result.error;
    },
    onSettled: () =>
      cache.invalidateQueries({ queryKey: ["guest-services", businessId] }),
  });
  const transition = useMutation({
    mutationFn: ({
      row,
      status,
    }: {
      row: GuestRequest;
      status: GuestRequest["status"];
    }) => changeGuestStatus(row, status),
    onSettled: async () => {
      setPage(0);
      await cache.invalidateQueries({ queryKey: ["guest-queue", businessId] });
    },
  });
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Demandes acceptées sur la fiche</h2>
      {settings.isError ? (
        <Button onClick={() => settings.refetch()}>
          Réessayer de charger les réglages
        </Button>
      ) : (
        <div className="space-y-2">
          {(["reservations", "waitlist"] as const).map((field) => (
            <label key={field} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!settings.data?.[field]}
                disabled={settings.isPending || config.isPending}
                onChange={() => config.mutate(field)}
              />
              {field === "reservations"
                ? "Réservations sur demande"
                : "Liste d’attente"}
            </label>
          ))}
        </div>
      )}
      {config.isError && (
        <p role="alert">Le réglage n’a pas pu être enregistré.</p>
      )}
      <h2 className="font-semibold">Demandes en cours</h2>
      {queue.isPending ? (
        <p>Chargement…</p>
      ) : queue.isError ? (
        <Button onClick={() => queue.refetch()}>Recharger les demandes</Button>
      ) : !queue.data.length ? (
        <p>Aucune demande sur cette page.</p>
      ) : (
        queue.data.slice(0, 20).map((row) => (
          <article key={row.id} className="rounded-xl border p-3 space-y-2">
            <h3 className="font-semibold">{row.guest_name}</h3>
            <p>{guestDescription(row)}</p>
            <p>{statusLabel[row.status]}</p>
            <div className="flex flex-wrap gap-2">
              {(row.status === "pending"
                ? (["accepted", "declined"] as const)
                : (["completed", "cancelled"] as const)
              ).map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  disabled={transition.isPending}
                  onClick={() => transition.mutate({ row, status })}
                >
                  {
                    {
                      accepted: "Accepter",
                      declined: "Refuser",
                      completed: "Terminer",
                      cancelled: "Annuler",
                    }[status]
                  }
                </Button>
              ))}
            </div>
          </article>
        ))
      )}
      {transition.isError && (
        <p role="alert">
          La demande a changé ou l’enregistrement a échoué. Vérifiez son état.
        </p>
      )}
      {(page > 0 || queue.data?.length > 20) && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            disabled={!(queue.data?.length > 20)}
            onClick={() => setPage(page + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MerchantGuestManager() {
  return (
    <OwnedBusinessPanel title="Réservations et liste d’attente">
      {(businessId, userId) => (
        <GuestDesk businessId={businessId} userId={userId} />
      )}
    </OwnedBusinessPanel>
  );
}
