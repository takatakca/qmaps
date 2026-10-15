// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

const mock = vi.hoisted(() => ({
  onAuth: null as null | ((event: string, session: Session | null) => void),
  requests: [] as Array<{ id: string; resolve: (value: { data: Array<{ role: string }>; error: null }) => void }>,
  initial: null as null | ((value: { data: { session: Session | null } }) => void),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: (_key: string, id: string) => new Promise((resolve) => mock.requests.push({ id, resolve })),
      }),
    }),
    auth: {
      onAuthStateChange: (fn: typeof mock.onAuth) => {
        mock.onAuth = fn;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      getSession: () => new Promise((resolve) => { mock.initial = resolve; }),
      signOut: vi.fn(async () => ({})),
      signUp: vi.fn(async () => ({ error: null })),
      signInWithPassword: vi.fn(async () => ({ error: null })),
    },
  },
}));
import { AuthProvider, useAuth } from "@/hooks/useAuth";
const Observe = () => {
  const { user, isAdmin, isMerchant } = useAuth();
  return <div data-testid="auth">{user?.id ?? "none"}:{String(isAdmin)}:{String(isMerchant)}</div>;
};
const asSession = (id: string) => ({ user: { id } } as Session);
beforeEach(() => { mock.onAuth = null; mock.initial = null; mock.requests.length = 0; });

describe("AuthProvider account-scoped privileges", () => {
  it("ignores delayed admin roles and bootstrap sessions from another user", async () => {
    render(<AuthProvider><Observe /></AuthProvider>);
    act(() => mock.onAuth?.("SIGNED_IN", asSession("alice")));
    await waitFor(() => expect(mock.requests.some((r) => r.id === "alice")).toBe(true));
    act(() => mock.onAuth?.("SIGNED_IN", asSession("bob")));
    expect(screen.getByTestId("auth").textContent).toBe("bob:false:false");
    const request = mock.requests.find((r) => r.id === "alice")!;
    await act(async () => { request.resolve({ data: [{ role: "admin" }], error: null }); });
    expect(screen.getByTestId("auth").textContent).toBe("bob:false:false");
    await waitFor(() => expect(mock.requests.some((r) => r.id === "bob")).toBe(true));
    await act(async () => { mock.requests.find((r) => r.id === "bob")!.resolve({ data: [{ role: "user" }], error: null }); });
    await act(async () => { mock.initial?.({ data: { session: asSession("alice") } }); });
    expect(screen.getByTestId("auth").textContent).toBe("bob:false:false");
  });
  it("drops pending privileged results after signout", async () => {
    render(<AuthProvider><Observe /></AuthProvider>);
    act(() => mock.onAuth?.("SIGNED_IN", asSession("alice")));
    await waitFor(() => expect(mock.requests.length).toBeGreaterThan(0));
    act(() => mock.onAuth?.("SIGNED_OUT", null));
    await act(async () => { mock.requests[0].resolve({ data: [{ role: "admin" }], error: null }); });
    expect(screen.getByTestId("auth").textContent).toBe("none:false:false");
  });
});
