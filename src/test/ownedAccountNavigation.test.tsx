import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BottomNav from "@/components/BottomNav";
import QuickAuthMenu from "@/components/home/QuickAuthMenu";

const { useAuth, signInWithOAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth }));
vi.mock("@/hooks/useUnreadCounts", () => ({
  useUnreadCounts: () => ({ unreadNotifications: 3, unreadMessages: 7 }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signInWithOAuth } } }));
vi.mock("@/i18n/language", () => ({
  useLang: () => ({
    t: (key: string) => ({
      signIn: "Se connecter",
      account: "Compte",
      createAccount: "Créer un compte",
      continueEmail: "Continuer par courriel",
      smsVerify: "Vérifier par SMS",
      publicProfile: "Profil public",
    })[key] ?? key,
  }),
}));

let host: HTMLDivElement;
let root: Root;

function Destination() {
  const { pathname, search } = useLocation();
  return <output aria-label="Destination">{pathname + search}</output>;
}

async function render(view: ReactNode) {
  await act(async () => root.render(
    <MemoryRouter initialEntries={["/city/montreal"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {view}<Destination />
    </MemoryRouter>,
  ));
}

async function openAccountMenu() {
  await render(<QuickAuthMenu />);
  const trigger = host.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]');
  expect(trigger).toBeInTheDocument();
  await act(async () => trigger!.click());
  expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
}

async function choose(label: string) {
  const menu = document.querySelector('[role="dialog"]');
  const option = [...(menu?.querySelectorAll("button") ?? [])].find(button =>
    button.textContent?.trim().startsWith(label),
  );
  expect(option, label).toBeInTheDocument();
  await act(async () => option!.click());
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  useAuth.mockReset().mockReturnValue({ user: null, isAdmin: false, isMerchant: false, signOut: vi.fn() });
  signInWithOAuth.mockReset();
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("owned QMAPS account navigation", () => {
  it("opens the owned account from Moi and keeps notifications on Plus", async () => {
    await render(<BottomNav />);
    const mine = host.querySelector<HTMLButtonElement>('button[aria-label="Moi"]');
    const more = host.querySelector<HTMLButtonElement>('button[aria-label="Plus"]');
    expect(mine).toHaveTextContent("Moi");
    expect(mine).not.toHaveTextContent("7");
    expect(more).toHaveTextContent("3");
    await act(async () => mine!.click());
    expect(host.querySelector("output")?.textContent).toBe("/compte");
    expect(mine).toHaveAttribute("aria-current", "page");
  });

  it("starts owned registration from the generic Créer un compte action", async () => {
    await openAccountMenu();
    await choose("Créer un compte");
    expect(host.querySelector("output")?.textContent).toBe("/compte?mode=inscription");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it.each([
    ["Continuer par courriel", "/auth"],
    ["Vérifier par SMS", "/auth?verify=sms"],
  ])("keeps explicit legacy access by %s", async (label, path) => {
    await openAccountMenu();
    await choose(label);
    expect(host.querySelector("output")?.textContent).toBe(path);
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("keeps the explicit profile action for a signed-in legacy user", async () => {
    useAuth.mockReturnValue({
      user: { id: "legacy-user", email: "legacy@example.invalid" },
      isMerchant: false,
      isAdmin: false,
      signOut: vi.fn(),
    });
    await openAccountMenu();
    await choose("Profil public");
    expect(host.querySelector("output")?.textContent).toBe("/profile");
  });
});
