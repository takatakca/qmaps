import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOwnedNearbyBusinesses } from "@/hooks/useOwnedNearbyBusinesses";
import { getCurrentPosition } from "@/lib/geo";
import { nearbyPlaces } from "@/lib/ownedDirectory";

vi.mock("@/lib/geo", () => ({ getCurrentPosition: vi.fn() }));

const position = { latitude: 45.508945, longitude: -73.554187 };
const route = "/api/v1/browser/directory/nearby?lat=45.509&lng=-73.554&limit=6";
const item = {
  id: "owned-place",
  name: "Commerce QMAPS",
  distance_meters: 165,
  business_categories: [{ categories: { id: "cat-1", name: "Restaurants", slug: "restaurants" } }],
};
const getPosition = vi.mocked(getCurrentPosition);
let host: HTMLDivElement;
let root: Root;
let unmounted: boolean;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  unmounted = false;
  getPosition.mockReset().mockResolvedValue(position);
});

afterEach(() => {
  if (!unmounted) act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

function Probe() {
  const { loading, businesses, error } = useOwnedNearbyBusinesses(6);
  return <div aria-busy={loading}>
    {error && <p role="alert">{error}</p>}
    {businesses.map(place => <p key={place.id}>{place.name} · {place.category_name}</p>)}
  </div>;
}

async function mount() {
  await act(async () => root.render(<Probe />));
}

describe("homepage nearby listings from QMAPS", () => {
  it("loads the owned result and sends only rounded coordinates", async () => {
    const request = vi.fn(async () => Response.json({ items: [item], next: null }));
    vi.stubGlobal("fetch", request);
    await mount();

    expect(request).toHaveBeenCalledExactlyOnceWith(route, expect.objectContaining({ credentials: "same-origin" }));
    expect(host.textContent).toContain("Commerce QMAPS · Restaurants");
    expect(host.firstElementChild?.getAttribute("aria-busy")).toBe("false");
  });

  it("retries only an explicitly rejected session as a guest", async () => {
    const request = vi.fn(async (_input: string, options: RequestInit) =>
      options.credentials === "same-origin" ? Response.json({ error: "Session expirée" }, { status: 401 }) :
        Response.json({ items: [item], next: null }));
    vi.stubGlobal("fetch", request);
    const places = await nearbyPlaces(position, 6, new AbortController().signal);

    expect(places[0]?.id).toBe(item.id);
    expect(request.mock.calls.map(([url, opts]) => [url, opts.credentials])).toEqual([
      [route, "same-origin"], [route, "omit"],
    ]);
  });

  it("does not query the catalogue if geolocation is refused", async () => {
    getPosition.mockRejectedValue(new Error("Impossible d'accéder à votre position."));
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await mount();

    expect(request).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Impossible d'accéder à votre position.");
    expect(host.firstElementChild?.getAttribute("aria-busy")).toBe("false");
  });

  it("reports an unavailable endpoint without asking the old catalogue", async () => {
    const request = vi.fn(async () => new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", request);
    await mount();

    expect(request).toHaveBeenCalledExactlyOnceWith(route, expect.objectContaining({ credentials: "same-origin" }));
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Impossible de charger les commerces à proximité.");
  });

  it("does not render an unranked directory response as nearby results", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ items: [{ id: item.id }], next: null })));
    await mount();

    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Impossible de charger les commerces à proximité.");
    expect(host.textContent).not.toContain("Commerce QMAPS");
  });

  it("cancels the request on navigation", async () => {
    const request = vi.fn(async (_input: string, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", request);
    await mount();
    const requestSignal = request.mock.calls[0]?.[1].signal;
    expect(requestSignal?.aborted).toBe(false);
    await act(async () => root.unmount());
    unmounted = true;
    expect(requestSignal?.aborted).toBe(true);
  });
});
