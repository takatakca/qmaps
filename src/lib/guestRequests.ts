import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type GuestRequest = Tables<"guest_requests">;
export const statusLabel: Record<GuestRequest["status"], string> = {
  pending: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export async function guestServices(businessId: string) {
  const { data, error } = await supabase
    .from("guest_services")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function changeGuestStatus(
  request: GuestRequest,
  status: GuestRequest["status"],
) {
  const { error } = await supabase
    .from("guest_requests")
    .update({ status })
    .eq("business_id", request.business_id)
    .eq("id", request.id)
    .eq("status", request.status)
    .select("id")
    .single();
  if (error) throw error;
}

export function guestDescription(row: GuestRequest) {
  const service =
    row.kind === "reservation" ? "Réservation" : "Liste d’attente";
  return [
    service,
    `${row.party_size} pers.`,
    row.requested_time?.replace("T", " ").slice(0, 16),
  ]
    .filter(Boolean)
    .join(" · ");
}
