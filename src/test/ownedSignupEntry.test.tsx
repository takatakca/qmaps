import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnedWorkspace from "@/pages/OwnedWorkspace";
import { ownedAccountUrl, ownedMerchantUrl, ownedReviewUrl, ownedSignupUrl } from "@/lib/ownedRoutes";

let host: HTMLDivElement;
let root: Root;
let cache: QueryClient;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  act(() => root.unmount());
  cache.clear();
  host.remove();
  vi.unstubAllGlobals();
});

async function open(path: string) {
  const request = vi.fn(async (_input: string) =>
    Response.json({ error: "Connexion requise" }, { status: 401 }),
  );
  vi.stubGlobal("fetch", request);
  await act(async () => root.render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OwnedWorkspace />
      </MemoryRouter>
    </QueryClientProvider>,
  ));
  expect(request.mock.calls.map(([url]) => url)).toEqual(["/api/v1/browser/me"]);
}

const heading = () => host.querySelector("form h2");
const password = () => host.querySelector("#q-pass");
const button = (text: string) => [...host.querySelectorAll("button")]
  .find(element => element.textContent?.trim() === text);

describe("entry to the owned account", () => {
  it("opens registration by QMAPS identifier without starting a session write", async () => {
    await open(ownedSignupUrl);
    expect(heading()).toHaveTextContent("Créer mon compte");
    expect(host.querySelector('label[for="q-handle"]')).toHaveTextContent("Identifiant QMAPS");
    expect(password()).toHaveAttribute("autocomplete", "new-password");
    expect(host.querySelector('input[type="email"]')).toBeNull();
    expect(host.querySelector("form button[type=submit]")).toHaveTextContent("Créer mon compte");

    await act(async () => button("Se connecter")!.click());
    expect(heading()).toHaveTextContent("Connexion par identifiant");
    expect(password()).toHaveAttribute("autocomplete", "current-password");
    await act(async () => button("Mot de passe oublié")!.click());
    expect(heading()).toHaveTextContent("Récupérer mon compte");
    expect(host.querySelector("#q-recovery")).not.toBeNull();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it.each([
    ownedAccountUrl,
    ownedAccountUrl + "?mode=inconnu",
    ownedMerchantUrl + "&mode=inscription",
    ownedReviewUrl + "&mode=inscription",
    "/console?mode=inscription",
    "/compte/fermeture?mode=inscription",
  ])("keeps identifier login as the default for %s", async path => {
    await open(path);
    expect(heading()).toHaveTextContent("Connexion par identifiant");
    expect(password()).toHaveAttribute("autocomplete", "current-password");
  });
});
