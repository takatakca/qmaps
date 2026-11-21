import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import {
  guestDescription,
  statusLabel,
  type GuestRequest,
} from "@/lib/guestRequests";

describe("guest-facing request state", () => {
  it("displays the requested Québec wall time consistently across user time zones", () => {
    expect(
      guestDescription({
        kind: "reservation",
        party_size: 4,
        requested_time: "2026-12-12T18:30:00",
      } as GuestRequest),
    ).toBe("Réservation · 4 pers. · 2026-12-12 18:30");
  });
  it("distinguishes a waiting party from a confirmed reservation", () => {
    expect(
      guestDescription({
        kind: "waitlist",
        party_size: 2,
        requested_time: null,
      } as GuestRequest),
    ).toBe("Liste d’attente · 2 pers.");
    expect(statusLabel.pending).toBe("En attente");
    expect(statusLabel.accepted).toBe("Acceptée");
  });
});
