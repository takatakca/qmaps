import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicOwnedListing from "@/components/business/PublicOwnedListing";

vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/account/OwnedGallery", () => ({
  default: ({ publicCredentials }: { publicCredentials?: string }) => <div data-gallery-credentials={publicCredentials} />,
}));
vi.mock("@/components/account/OwnedReviews", () => ({
  default: ({ publicCredentials }: { publicCredentials?: string }) => <div data-reviews-credentials={publicCredentials} />,
}));

let host: HTMLElement;
let root: Root;
const municipalSource = "https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires";
const ccByLicense = "https://creativecommons.org/licenses/by/4.0/deed.fr";
const municipalImport = {
  source: "mtl_food", external_id: "013724", licence: "CC-BY-4.0", cohort: "mtl-2026-11-27-v1",
};

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

async function showPlace(id: string) {
  await act(async () => root.render(<MemoryRouter>
    <PublicOwnedListing id={id} legacyUnavailable={false} retryLegacy={vi.fn()} />
  </MemoryRouter>));
}

describe("public QMAPS detail", () => {
  it("keeps the example identifiable without putting Démo in its title", async () => {
    const id = "a9bf0001-0000-4000-8000-000000000002";
    const fetchPlace = vi.fn(async () => Response.json({ id, name: "QMAPS Démo — Café du quartier", city: "Montréal" }));
    vi.stubGlobal("fetch", fetchPlace);
    await showPlace(id);

    expect(host.querySelector("h1")?.textContent).toBe("Café du quartier");
    expect(host.textContent).toContain("Fiche d’exemple");
    expect(host.querySelector('a[href*="onglet=avis"]')).toBeNull();
    expect(document.title).not.toContain("Démo");
    expect(fetchPlace).toHaveBeenCalledWith("/api/v1/browser/places/" + id, expect.objectContaining({ method: "GET" }));
  });

  it("shows ON2GO credit and a shared kitchen without labeling a real listing as an example", async () => {
    const id = "e01de00e-6de9-5663-b09b-18284e356a83";
    const description = "Enseigne de restauration répertoriée à cette cuisine partagée de Notre-Dame-de-Grâce. Cuisine : Pizza. Source : ON2GO.ca.";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      id, name: "PPP Pizzeria", city: "Montréal", address: "6280 Av Somerled", description,
    })));
    await showPlace(id);

    expect(host.querySelector("h1")?.textContent).toBe("PPP Pizzeria");
    expect(host.textContent).toContain("6280 Av Somerled · Montréal");
    expect(host.textContent).toContain(description);
    expect(host.textContent).not.toContain("Fiche d’exemple");
    expect(host.textContent).not.toContain("Fiche de source municipale");
    expect(host.querySelector('a[href="/compte?onglet=avis&fiche=' + id + '"]')?.textContent).toBe("Écrire un avis");
    expect(host.querySelector('a[href="/compte?fiche=' + id + '"]')).not.toBeNull();
  });

  it("credits the Montréal municipal source without presenting the listing as verified", async () => {
    const id = "1944a6d1-a00d-49b9-84b0-c480074e3f26";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      id, name: "Restaurant Pilote", city: "Montréal", address: "123 rue Test",
      attributes: {
        qmaps_directory_import: { ...municipalImport, url: "https://untrusted.example/source" },
      },
    })));
    await showPlace(id);

    expect(host.querySelector("h1")?.textContent).toBe("Restaurant Pilote");
    expect(host).toHaveTextContent("123 rue Test · Montréal");
    expect(host).toHaveTextContent("Fiche de source municipale");
    expect(host).toHaveTextContent("Adaptation par FLEXS et QMAPS");
    expect(host).toHaveTextContent("Référence municipale 013724");
    expect(host.querySelector(`a[href="${municipalSource}"]`)).toHaveTextContent("Ville de Montréal");
    expect(host.querySelector(`a[href="${ccByLicense}"]`)).toHaveTextContent("CC BY 4.0");
    expect(host).toHaveTextContent("Les horaires et l’exploitant actuel ne sont pas confirmés");
    expect(host).not.toHaveTextContent(/commerce vérifié|ouvert maintenant|fermé/i);
    expect(host.querySelector('a[href*="untrusted.example"]')).toBeNull();
    expect(host.querySelector('a[href="/compte?onglet=avis&fiche=' + id + '"]')).toHaveTextContent("Écrire un avis");
  });

  it.each([
    ["missing metadata", undefined],
    ["another source", { source: "on2go.ca", external_id: "013724", licence: "CC-BY-4.0" }],
    ["invalid reference", { ...municipalImport, external_id: "ref-013724" }],
    ["invalid licence", { ...municipalImport, licence: "ODbL-1.0" }],
  ])("does not add municipal credit with %s", async (_label, marker) => {
    const id = "1944a6d1-a00d-49b9-84b0-c480074e3f26";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      id, name: "Commerce sans crédit municipal", city: "Montréal",
      attributes: { qmaps_directory_import: marker },
    })));
    await showPlace(id);

    expect(host).toHaveTextContent("Commerce sans crédit municipal");
    expect(host).not.toHaveTextContent("Fiche de source municipale");
    expect(host.querySelector(`a[href="${municipalSource}"]`)).toBeNull();
    expect(host.querySelector(`a[href="${ccByLicense}"]`)).toBeNull();
  });

  it("reopens the public detail as a guest after the browser session expires", async () => {
    const id = "1944a6d1-a00d-49b9-84b0-c480074e3f26";
    const request = vi.fn(async (_url: string, options: RequestInit) => options.credentials === "same-origin"
      ? Response.json({ error: "Session expirée" }, { status: 401 })
      : Response.json({ id, name: "Mon Commerce", city: "Montréal" }));
    vi.stubGlobal("fetch", request);
    await showPlace(id);

    expect(host.querySelector("h1")?.textContent).toBe("Mon Commerce");
    expect(request.mock.calls.map(([, options]) => options.credentials)).toEqual(["same-origin", "omit"]);
    expect(host.querySelector("[data-gallery-credentials=omit]")).not.toBeNull();
    expect(host.querySelector("[data-reviews-credentials=omit]")).not.toBeNull();
  });

  it.each([403, 404])("does not change viewer when the detail returns %i", async (status) => {
    const request = vi.fn(async () => Response.json({ error: "Fiche introuvable" }, { status }));
    vi.stubGlobal("fetch", request);
    await showPlace("1944a6d1-a00d-49b9-84b0-c480074e3f26");

    expect(request).toHaveBeenCalledTimes(1);
    expect(host.querySelector("h1")?.textContent).toBe(status === 404 ? "Commerce introuvable" : "Impossible de charger la fiche");
    expect(host.querySelector("[data-gallery-credentials]")).toBeNull();
  });
});
