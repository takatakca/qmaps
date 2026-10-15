// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const mounted: Array<{ host: HTMLDivElement; root: Root }> = [];
const mount = (): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => { root.render(<AuthProvider><Observe /></AuthProvider>); });
  mounted.push({ host, root });
  return host;
};
const read = (host: HTMLDivElement) => host.querySelector('[data-testid="auth"]')?.textContent;
const until = async (assertion: () => void): Promise<void> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { assertion(); return; } catch (error) { lastError = error; }
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  }
  throw lastError;
};

beforeEach(() => {
  mock.onAuth = null;
  mock.initial = null;
  mock.requests.length = 0;
});
afterEach(() => {
  for (const { host, root } of mounted.splice(0)) {
    act(() => root.unmount());
    host.remove();
  }
});

describe("AuthProvider account-scoped privileges", () => {
  it("ignores delayed admin roles and bootstrap sessions from another user", async () => {
    const host = mount();
    act(() => { mock.onAuth?.("SIGNED_IN", asSession("alice")); });
    await until(() => expect(mock.requests.some((r) => r.id === "alice")).toBe(true));

    act(() => { mock.onAuth?.("SIGNED_IN", asSession("bob")); });
    expect(read(host)).toBe("bob:false:false");

    await act(async () => {
      mock.requests.find((r) => r.id === "alice")!.resolve({ data: [{ role: "admin" }], error: null });
    });
    expect(read(host)).toBe("bob:false:false");

    await until(() => expect(mock.requests.some((r) => r.id === "bob")).toBe(true));
    await act(async () => {
      mock.requests.find((r) => r.id === "bob")!.resolve({ data: [{ role: "user" }], error: null });
    });
    await act(async () => { mock.initial?.({ data: { session: asSession("alice") } }); });
    expect(read(host)).toBe("bob:false:false");
  });

  it("drops pending privileged results after signout", async () => {
    const host = mount();
    act(() => { mock.onAuth?.("SIGNED_IN", asSession("alice")); });
    await until(() => expect(mock.requests.some((r) => r.id === "alice")).toBe(true));
    act(() => { mock.onAuth?.("SIGNED_OUT", null); });
    await act(async () => {
      mock.requests.find((r) => r.id === "alice")!.resolve({ data: [{ role: "admin" }], error: null });
    });
    expect(read(host)).toBe("none:false:false");
  });
});
