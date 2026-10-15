// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";

const load = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: (_column: string, businessId: string) => ({
          maybeSingle: () => load(businessId),
        }),
      }),
    }),
  },
}));

describe("merchant subscription isolation", () => {
  beforeEach(() => load.mockReset());

  it("never displays the prior company's paid plan while switching businesses", async () => {
    let resolveOld!: (value: unknown) => void;
    load.mockImplementation((id: string) => id === "business-old"
      ? new Promise((resolve) => { resolveOld = resolve; })
      : Promise.resolve({ data: null, error: null }));
    const { result, rerender } = renderHook(
      ({ id }) => useMerchantSubscription(id),
      { initialProps: { id: "business-old" } },
    );

    await waitFor(() => expect(load).toHaveBeenCalledWith("business-old"));
    rerender({ id: "business-new" });
    expect(result.current.subscription).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveOld({ data: { plan: "premium", status: "active" }, error: null });
    });
    await waitFor(() => expect(load).toHaveBeenCalledWith("business-new"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscription).toBeNull();
    expect(result.current.isProOrBetter).toBe(false);
  });

  it("shows a database read error instead of silently claiming a free subscription", async () => {
    load.mockResolvedValue({ data: null, error: { message: "RLS unavailable" } });
    const { result } = renderHook(() => useMerchantSubscription("business-one"));
    await waitFor(() => expect(result.current.error).toBe("RLS unavailable"));
    expect(result.current.subscription).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("clears an active paid plan when there is no business selected", async () => {
    load.mockResolvedValue({ data: { plan: "pro", status: "active" }, error: null });
    const { result, rerender } = renderHook(
      ({ id }) => useMerchantSubscription(id),
      { initialProps: { id: "business-one" as string | null } },
    );
    await waitFor(() => expect(result.current.subscription?.plan).toBe("pro"));
    rerender({ id: null });
    expect(result.current.subscription).toBeNull();
    expect(result.current.isProOrBetter).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});
