import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicOwnedListing from "@/components/business/PublicOwnedListing";

vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/account/OwnedGallery", () => ({ default: () => null }));
vi.mock("@/components/account/OwnedReviews", () => ({ default: () => null }));

let host: HTMLElement;
let root: Root;

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
  });
});
