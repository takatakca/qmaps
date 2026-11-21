import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  guestServices,
  guestDescription,
  statusLabel,
  changeGuestStatus,
  type GuestRequest,
} from "@/lib/guestRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GuestRequests({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  return (
    <Requests
      key={user?.id ?? "visitor"}
      businessId={businessId}
      userId={user?.id}
    />
  );
}

function Requests({
  businessId,
  userId,
}: {
  businessId: string;
  userId?: string;
}) {
  const cache = useQueryClient();
  const [kind, setKind] = useState<GuestRequest["kind"] | null>(null);
  const [name, setName] = useState("");
  const [size, setSize] = useState("2");
  const [date, setDate] = useState("");
  const settings = useQuery({
    queryKey: ["guest-services", businessId, userId ?? "visitor"],
    queryFn: () => guestServices(businessId),
  });
  const key = ["my-guest-requests", businessId, userId];
  const mine = useQuery({
    queryKey: key,
    enabled: !!userId,
    refetchInterval: 30000,
    queryFn: async () => {
      const rows = () =>
        supabase
          .from("guest_requests")
          .select("*")
          .eq("business_id", businessId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
      const [active, recent] = await Promise.all([
        rows().in("status", ["pending", "accepted"]),
        rows().in("status", ["completed", "cancelled", "declined"]).limit(10),
      ]);
      if (active.error || recent.error) throw active.error || recent.error;
      return [...active.data, ...recent.data];
    },
  });
  const update = useMutation({
    mutationFn: async (cancel: GuestRequest | null) => {
      if (cancel) return changeGuestStatus(cancel, "cancelled");
      const { error } = await supabase
        .from("guest_requests")
        .insert({
          business_id: businessId,
          kind,
          guest_name: name.trim(),
          party_size: Number(size),
          requested_time: kind === "reservation" ? date : null,
        })
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      setKind(null);
      setDate("");
    },
    onSettled: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: key }),
        cache.invalidateQueries({ queryKey: ["guest-queue", businessId] }),
      ]);
    },
  });
  const available = settings.data;
  const options = (["reservation", "waitlist"] as const).filter(
    (k) => available?.[k === "reservation" ? "reservations" : "waitlist"],
  );
  if (
    !options.length &&
    !mine.data?.length &&
    !settings.isError &&
    !mine.isError
  )
    return null;
  return (
    <section className="mx-4 my-4 rounded-xl border p-4 space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Réservations et liste d’attente
      </h2>
      {settings.isError && (
        <Button variant="outline" onClick={() => settings.refetch()}>
          Recharger les disponibilités
        </Button>
      )}
      {mine.isError && (
        <Button variant="outline" onClick={() => mine.refetch()}>
          Recharger mes demandes
        </Button>
      )}
      {options.length > 0 &&
        (!userId ? (
          <Link className="text-primary underline" to="/auth">
            Me connecter pour faire une demande
          </Link>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((k) => (
              <Button
                key={k}
                variant="outline"
                disabled={
                  mine.isPending ||
                  mine.isError ||
                  update.isPending ||
                  mine.data?.some(
                    (row) =>
                      row.kind === k &&
                      ["accepted", "pending"].includes(row.status),
                  )
                }
                onClick={() => {
                  setKind(k);
                  update.reset();
                }}
              >
                {k === "reservation"
                  ? "Demander une réservation"
                  : "Joindre la liste d’attente"}
              </Button>
            ))}
          </div>
        ))}
      {userId && kind && options.includes(kind) && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && !update.isPending) update.mutate(null);
          }}
        >
          <label className="block">
            Nom pour l’accueil
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            Nombre de personnes
            <Input
              required
              type="number"
              min={1}
              max={30}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </label>
          {kind === "reservation" && (
            <label className="block">
              Date et heure souhaitées (heure de Montréal)
              <Input
                required
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          )}
          <p className="text-sm text-muted-foreground">
            Le commerce confirmera votre demande ici.
          </p>
          <Button disabled={update.isPending || !name.trim()}>
            Envoyer la demande
          </Button>
        </form>
      )}
      {update.isError && (
        <p role="alert">
          Enregistrement impossible. Vérifiez la date et vos demandes, puis
          réessayez.
        </p>
      )}
      {mine.data?.map((row) => (
        <div className="border-t pt-2" key={row.id}>
          <p>
            {guestDescription(row)} · <strong>{statusLabel[row.status]}</strong>
          </p>
          {["accepted", "pending"].includes(row.status) && (
            <Button
              variant="link"
              disabled={update.isPending}
              onClick={() => update.mutate(row)}
            >
              Annuler ma demande
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}
