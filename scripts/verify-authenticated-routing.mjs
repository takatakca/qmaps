import { pathToFileURL } from "node:url";

const origins = ["https://qmaps.ca", "https://www.qmaps.ca", "https://qmaps.takatak.ca"];
const roles = ["CLIENT", "OBSERVER", "MERCHANT", "ADMIN"];
const preferences = "/me/directory-preferences";
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function must(condition, message) {
  if (!condition) throw new Error(message);
}

export function readQaFixture(env) {
  const accounts = Object.fromEntries(roles.map(role => {
    const key = `QMAPS_QA_${role}`;
    const handle = env[`${key}_HANDLE`];
    const password = env[`${key}_PASSWORD`];
    must(/^qa-[a-z0-9_-]{1,37}$/.test(handle ?? ""), `${key}_HANDLE doit désigner un compte de test qa-.`);
    must(typeof password === "string" && password.length >= 12 && Buffer.byteLength(password) <= 256,
      `${key}_PASSWORD absent ou invalide.`);
    return [role, { handle, password }];
  }));
  must(new Set(Object.values(accounts).map(account => account.handle)).size === roles.length,
    "Quatre comptes de test distincts sont requis.");
  must(uuid.test(env.QMAPS_QA_PLACE_ID ?? ""), "QMAPS_QA_PLACE_ID doit désigner la fiche du commerçant de test.");
  return { accounts, placeId: env.QMAPS_QA_PLACE_ID.toLowerCase() };
}

export async function verifyAuthenticatedRouting(env, request = fetch, report = console.log) {
  const { accounts, placeId } = readQaFixture(env);
  const opened = [];

  async function call(origin, path, status, { method = "GET", cookie, body } = {}) {
    const label = `${origin} ${method} ${path}`;
    const headers = { Accept: "application/json" };
    if (method !== "GET") headers.Origin = origin;
    if (cookie) headers.Cookie = cookie;
    if (body) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await request(origin + "/api/v1/browser" + path, {
        method, headers, redirect: "error", cache: "no-store",
        signal: AbortSignal.timeout(10000), body: body && JSON.stringify(body),
      });
    } catch {
      throw new Error(`${label} — requête échouée ou redirigée.`);
    }
    must(response.status === status, `${label} — HTTP ${response.status}, attendu ${status}.`);
    return response;
  }

  async function json(response) {
    must(response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json",
      "Réponse JSON requise.");
    try { return await response.json(); }
    catch { throw new Error("Réponse JSON invalide."); }
  }

  async function signIn(origin, role) {
    const response = await call(origin, "/accounts/login", 200, { method: "POST", body: accounts[role] });
    const header = response.headers.get("set-cookie") ?? "";
    const cookie = /^(__Host-qmaps_session=[A-Za-z0-9_-]{43})(?:;|$)/.exec(header)?.[1];
    if (cookie) opened.push({ origin, cookie });
    must(cookie && !/;\s*Domain=/i.test(header) && /;\s*Path=\/(?:;|$)/i.test(header) &&
      /;\s*Secure(?:;|$)/i.test(header) && /;\s*HttpOnly(?:;|$)/i.test(header) &&
      /;\s*SameSite=Strict(?:;|$)/i.test(header), `${origin} — cookie de session inattendu.`);
    const result = await json(response);
    const me = await json(await call(origin, "/me", 200, { cookie }));
    must(uuid.test(me?.id) && me.id === result?.user_id && result.token === undefined &&
      me.handle === accounts[role].handle &&
      Array.isArray(me.roles) && me.roles.includes("admin") === (role === "ADMIN"),
      `${origin} — identité ou rôle de recette inattendu (${role}).`);
    return { origin, cookie, id: me.id };
  }

  const get = async (session, path, status = 200) =>
    json(await call(session.origin, path, status, { cookie: session.cookie }));
  const list = async (session, path) => {
    const data = await get(session, path);
    must(Array.isArray(data), `${session.origin} — liste inattendue (${path}).`);
    return data;
  };
  const preference = async session => (await list(session, preferences)).find(item => item?.id === placeId);
  const write = (session, action) => call(session.origin, `${preferences}/${placeId}`, 204, {
    method: "PUT", cookie: session.cookie, body: { action, accountId: session.id },
  });

  let completed = false;
  try {
    const sessions = [];
    for (const origin of origins) {
      const anon = await json(await call(origin, preferences, 401));
      must(anon?.error === "Connexion requise", `${origin} — l’API anonyme ne confirme pas l’absence de session.`);
      const current = [];
      for (const role of roles) current.push(await signIn(origin, role));
      const [client, observer, merchant, admin] = current;
      must(new Set([client.id, observer.id, merchant.id, admin.id]).size === roles.length,
        `${origin} — comptes de recette non distincts.`);
      must((await list(merchant, "/me/places")).some(item => item?.id === placeId),
        `${origin} — le commerçant de test ne possède pas la fiche configurée.`);
      must(!(await list(client, "/me/places")).some(item => item?.id === placeId),
        `${origin} — la fiche commerçant apparaît dans les fiches du client.`);
      const adminConsole = await get(admin, "/console");
      must(adminConsole?.api === "QMAPS", `${origin} — console QMAPS inattendue.`);
      for (const user of [client, merchant]) await call(origin, "/console", 403, { cookie: user.cookie });
      must((await get(client, `/directory/${placeId}`))?.id === placeId,
        `${origin} — la fiche de recette n’est pas accessible au client.`);
      const canonical = sessions[0];
      must(!canonical || current.every((session, i) => session.id === canonical[i].id),
        `${origin} — comptes différents du domaine principal.`);
      sessions.push(current);
      report(`OK ${origin} — sessions, fiche du commerçant et accès console.`);
    }

    for (const [client, observer] of sessions) {
      must(!(await preference(client)) && !(await preference(observer)),
        "La fiche est déjà dans les préférences de recette. Choisir une nouvelle fiche de test.");
    }
    const [client, observer] = sessions[0];
    await write(client, "view");
    must((await preference(client))?.dismissed === false && !(await preference(observer)),
      "Consultation non enregistrée ou non isolée.");
    await write(client, "dismiss");
    for (const [reader, control] of sessions) {
      must((await preference(reader))?.dismissed === true && !(await preference(control)),
        `${reader.origin} — le retrait n’est pas persistant ou isolé.`);
      report(`OK ${reader.origin} — retrait conservé et isolé du deuxième compte.`);
    }
    completed = true;
  } finally {
    const cleanup = await Promise.allSettled(opened.map(({ origin, cookie }) =>
      call(origin, "/accounts/logout", 204, { method: "POST", cookie })));
    const failures = cleanup.filter(result => result.status === "rejected").length;
    if (failures) {
      const message = `Impossible de fermer ${failures} session(s) de recette.`;
      if (completed) throw new Error(message);
      report(message);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    must(process.argv.length === 3 && process.argv[2] === "--live-qa",
      "Utiliser --live-qa uniquement avec les comptes et la fiche de recette autorisés.");
    await verifyAuthenticatedRouting(process.env);
  } catch (error) {
    console.error(`ÉCHEC — ${error.message}`);
    process.exitCode = 1;
  }
}
