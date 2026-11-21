import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import { cityFilter, cityLabelFromSlug, searchUrl } from "@/lib/localSearch";
import { distanceMeters } from "@/lib/geo";

vi.mock("@/hooks/useAllCategories", () => ({
  useAllCategories: () => ({ categories: [] }),
  searchCategories: () => [{ id: "cafes", slug: "cafes", name: "Cafés" }],
}));

const Location = () => <output>{useLocation().search}</output>;
let root: Root | undefined;
afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe("local discovery", () => {
  it("matches both spellings observed in the live Montréal catalogue", () => {
    expect(cityLabelFromSlug("montreal")).toBe("Montréal");
    expect(cityFilter("montreal")).toContain('city.ilike."Montréal"');
    expect(cityFilter("Montréal")).toContain('city.ilike."Montreal"');
    expect(cityLabelFromSlug("trois-rivieres")).toBe("Trois-Rivières");
    expect(cityFilter("Trois-Rivières")).toContain('city.ilike."Trois Rivieres"');
  });
  it("submits a city alone and preserves it when users select a category", () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root!.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SearchBar initialCity="Montreal" /><Location /></MemoryRouter>));
    act(() => host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(host.querySelector("output")).toHaveTextContent("?city=Montr%C3%A9al");
    const field = host.querySelector<HTMLInputElement>('[aria-label="Recherche intelligente QMAPS"]')!;
    act(() => {
      field.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, "caf");
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => host.querySelector<HTMLButtonElement>("li button")!.click());
    expect(host.querySelector("output")).toHaveTextContent("?city=Montr%C3%A9al&category=cafes");
  });
  it("preserves existing text searches and encodes multiword terms", () => {
    expect(searchUrl("", "")).toBe("/search");
    expect(searchUrl(" R&B ", "")).toBe("/search?q=R%26B");
    expect(searchUrl("café", "Trois Rivieres")).toContain("city=Trois-Rivi%C3%A8res");
  });
  it("distinguishes missing coordinates from a listing at the user's position", () => {
    const here = { latitude: 45.5, longitude: -73.6 };
    expect(distanceMeters(here, null, -73.6)).toBeUndefined();
    expect(distanceMeters(here, 45.5, -73.6)).toBe(0);
    expect(distanceMeters(here, 45.51, -73.6)).toBeCloseTo(1112, -1);
  });
});
