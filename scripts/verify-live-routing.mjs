import { pathToFileURL } from "node:url";

const origins = [
  "https://qmaps.ca",
  "https://www.qmaps.ca",
  "https://qmaps.takatak.ca",
];
const needsSession = (body) => body?.error === "Connexion requise";
const checks = [
  {
    path: "/api/v1/health",
    status: 200,
    matches: (body) => body?.service === "QMAPS" && body.database === "PostgreSQL",
  },
  {
    path: "/api/v1/browser/directory?limit=1",
    status: 200,
    matches: (body) => Array.isArray(body?.items) &&
      (body.next === null || typeof body.next === "string"),
  },
  { path: "/api/v1/browser/me", status: 401, matches: needsSession },
  { path: "/api/v1/browser/me/directory-preferences", status: 401, matches: needsSession },
];

async function readJson(url, status, request) {
  try {
    const response = await request(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    });
    const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (response.status !== status || type !== "application/json") {
      await response.body?.cancel();
      return { error: `HTTP ${response.status}, ${type || "type absent"} (attendu HTTP ${status} JSON)` };
    }
    return { body: await response.json() };
  } catch {
    return { error: "La requête ou la lecture du JSON a échoué" };
  }
}

async function verify(url, check, request) {
  const { body, error } = await readJson(url, check.status, request);
  return error ?? (check.matches(body) ? null : "Le JSON ne correspond pas au contrat de l’API");
}

export async function verifyLiveRouting(request = fetch) {
  return Promise.all(origins.flatMap(origin => checks.map(async check => {
    const url = origin + check.path;
    return { url, error: await verify(url, check, request) };
  })));
}

const smokePageSize = 12;
const idShape = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const cursorShape = /^[A-Za-z0-9_-]{1,512}$/;
const inMontreal = (value) => typeof value === "string" &&
  value.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase() === "montreal";
const opaqueCursor = (value) => typeof value === "string" && cursorShape.test(value);
const pageMatches = (body) => Array.isArray(body?.items) && body.items.length > 0 &&
  body.items.length <= smokePageSize && body.items.every(row => typeof row?.id === "string" &&
    idShape.test(row.id) && inMontreal(row.city)) &&
  (body.next === null || opaqueCursor(body.next));

// This stricter opt-in check never treats the legacy catalogue as evidence
// that pagination is deployed. Montréal currently has more than 12 listings.
export async function verifyDirectoryPages(request = fetch) {
  const targets = origins.flatMap(origin => [
    origin + "/api/v1/browser/directory/results",
    origin + "/api/v1/directory/results",
  ]).concat("https://api.qmaps.ca/v1/directory/results");
  return Promise.all(targets.map(async path => {
    const filters = new URLSearchParams({ city: "Montréal", sort: "recommended", limit: String(smokePageSize) });
    const url = path + "?" + filters;
    const first = await readJson(url, 200, request);
    if (first.error) return { url, error: `Première page — ${first.error}` };
    if (!pageMatches(first.body)) return { url, error: "Première page invalide ou hors de Montréal" };
    if (first.body.items.length !== smokePageSize || !opaqueCursor(first.body.next))
      return { url, error: "Le catalogue ne permet pas de confirmer une deuxième page" };

    filters.set("after", first.body.next);
    const second = await readJson(path + "?" + filters, 200, request);
    if (second.error) return { url, error: `Deuxième page — ${second.error}` };
    if (!pageMatches(second.body) || second.body.next === first.body.next)
      return { url, error: "Deuxième page invalide, hors de Montréal ou curseur sans progression" };
    const ids = [...first.body.items, ...second.body.items].map(row => row.id.toLowerCase());
    return { url, error: new Set(ids).size !== ids.length ? "Identifiants répétés dans les deux pages" : null };
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = (await Promise.all([
    verifyLiveRouting(),
    process.argv.includes("--directory-pages") ? verifyDirectoryPages() : [],
  ])).flat();
  for (const { url, error } of results) {
    console.log(error ? `ÉCHEC ${url} — ${error}` : `OK ${url}`);
  }
  if (results.some(result => result.error)) process.exitCode = 1;
}
