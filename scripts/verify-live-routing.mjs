import { pathToFileURL } from "node:url";

const origins = ["https://qmaps.ca", "https://www.qmaps.ca"];
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

async function verify(url, check, request) {
  try {
    const response = await request(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    });
    const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (response.status !== check.status || type !== "application/json") {
      await response.body?.cancel();
      return `HTTP ${response.status}, ${type || "type absent"} (attendu HTTP ${check.status} JSON)`;
    }
    const body = await response.json();
    if (!check.matches(body)) return "Le JSON ne correspond pas au contrat de l’API";
    return null;
  } catch {
    return "La requête ou la lecture du JSON a échoué";
  }
}

export async function verifyLiveRouting(request = fetch) {
  return Promise.all(origins.flatMap(origin => checks.map(async check => {
    const url = origin + check.path;
    return { url, error: await verify(url, check, request) };
  })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await verifyLiveRouting();
  for (const { url, error } of results) {
    console.log(error ? `ÉCHEC ${url} — ${error}` : `OK ${url}`);
  }
  if (results.some(result => result.error)) process.exitCode = 1;
}
