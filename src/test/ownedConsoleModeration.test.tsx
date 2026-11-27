import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnedWorkspace from "@/pages/OwnedWorkspace";

const api = "/api/v1/browser/";
const owner = { id: "qa-owner", handle: "qa-owner", roles: ["admin"] };
let host: HTMLDivElement;
let root: Root;
let cache: QueryClient;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  notifyManager.setNotifyFunction(callback => { act(callback); });
});

afterEach(() => {
  act(() => root.unmount());
  cache.clear();
  notifyManager.setNotifyFunction(callback => { callback(); });
  host.remove();
  vi.unstubAllGlobals();
});

async function openConsole(roles: string[], consoleStatus = 200) {
  const request = vi.fn(async (url: string, options?: RequestInit) => {
    expect(options?.method ?? "GET").toBe("GET");
    if (url === api + "me") return Response.json({ ...owner, roles });
    if (url === "/qmaps-release.json") return Response.json({ sha: "a".repeat(40) });
    if (url === api + "console") return consoleStatus === 200
      ? Response.json({ places: 1, accounts: 1, media: 0, database: "PostgreSQL" })
      : Response.json({ error: "Accès propriétaire requis" }, { status: consoleStatus });
    if (url === api + "console/listing-reports") return Response.json([
      { id: "qa-report", target_type: "business", target_id: "qa-place", details: "Signalement de recette", created_at: "2026-11-27" },
    ]);
    if (url === api + "console/photo-reports" || url === api + "console/closures") return Response.json([]);
    throw new Error("Unexpected request in the owned console test");
  });
  vi.stubGlobal("fetch", request);
  await act(async () => root.render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={["/console"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OwnedWorkspace />
      </MemoryRouter>
    </QueryClientProvider>,
  ));
  return () => request.mock.calls.map(([url]) => url).filter(url => url.startsWith(api));
}

describe("owned console moderation navigation", () => {
  it("links the authorized owner to the existing report queues without leaving the console", async () => {
    const reads = await openConsole(owner.roles);
    await vi.waitFor(() => expect(host.querySelector("#moderation")).toHaveTextContent("Signalement de recette"));
    const link = host.querySelector('a[href="#moderation"]');
    const section = host.querySelector("#moderation");
    expect(link).toHaveTextContent("Signalements et modération");
    expect(section).toHaveAccessibleName("Modération de l’annuaire QMAPS");
    expect(section).toHaveAttribute("tabindex", "-1");
    expect(link!.compareDocumentPosition(section!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section).toHaveTextContent("Masquer la fiche");
    expect(section).toHaveTextContent("Photos signalées");
    expect(host.querySelector('a[href="/admin"]')).toBeNull();
    expect(reads()).toEqual(expect.arrayContaining([api + "console/listing-reports", api + "console/photo-reports"]));
  });

  it("does not request the console or report queues for a non-admin account", async () => {
    const reads = await openConsole(["user"]);
    await vi.waitFor(() => expect(host.querySelector('[role="alert"]')).toHaveTextContent("Accès propriétaire requis"));
    expect(host.querySelector("#moderation")).toBeNull();
    expect(reads()).toEqual([api + "me"]);
  });

  it("does not show or request queues if the API refuses the owner", async () => {
    const reads = await openConsole(owner.roles, 403);
    await vi.waitFor(() => expect(host.querySelector('[role="alert"]')).toHaveTextContent("Accès propriétaire requis"));
    expect(host.querySelector("#moderation")).toBeNull();
    expect(host.querySelector('a[href="#moderation"]')).toBeNull();
    expect(reads()).toEqual([api + "me", api + "console"]);
  });
});
