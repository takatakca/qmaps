import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const hashToken = (v) => createHash("sha256").update(v).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export async function transaction(pool, fn, { readOnly = false } = {}) {
  const db = await pool.connect();
  try {
    await db.query(readOnly ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" : "BEGIN");
    const result = await fn(db);
    await db.query("COMMIT");
    return result;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
    db.release();
  }
}
async function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  return (
    salt + ":" + (await derive(password, salt, 64, options)).toString("hex")
  );
}
async function matches(password, stored) {
  const [salt, hex] = (stored || "00".repeat(16) + ":" + "00".repeat(64)).split(
    ":",
  );
  return (
    timingSafeEqual(
      await derive(password, salt, 64, options),
      Buffer.from(hex, "hex"),
    ) && !!stored
  );
}
async function session(db, id) {
  const token = newToken();
  await db.query(
    "INSERT INTO qmaps_private.sessions VALUES ($1,$2,now()+interval '12 hours')",
    [hashToken(token), id],
  );
  return { token, user_id: id, expires_in: 43200 };
}
export async function userFor(pool, header) {
  if (!header) return null;
  const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header)?.[1];
  if (!token) throw new ApiError(401, "Session invalide");
  const result = await pool.query(
    "SELECT user_id FROM qmaps_private.sessions WHERE token_hash=$1 AND expires_at>now()",
    [hashToken(token)],
  );
  if (!result.rowCount) throw new ApiError(401, "Session expirée");
  return result.rows[0].user_id;
}
export async function logout(pool, header) {
  await userFor(pool, header);
  if (header)
    await pool.query("DELETE FROM qmaps_private.sessions WHERE token_hash=$1", [
      hashToken(header.slice(7)),
    ]);
}
let hashing = 0;
export async function account(pool, action, data, peer) {
  const handle =
    typeof data.handle === "string" ? data.handle.toLowerCase().trim() : "";
  if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(handle))
    throw new ApiError(400, "Identifiant de 3 à 40 caractères requis");
  const pass = data.password;
  if (
    typeof pass !== "string" ||
    pass.length < 12 ||
    Buffer.byteLength(pass) > 256
  )
    throw new ApiError(400, "Mot de passe de 12 caractères ou plus requis");
  if (
    action === "recover" &&
    !/^[A-Za-z0-9_-]{43}$/.test(data.recovery_code ?? "")
  )
    throw new ApiError(400, "Code de récupération invalide");
  if (hashing >= 4) throw new ApiError(429, "Réessayez plus tard");
  hashing++;
  try {
    await pool.query(
      "DELETE FROM qmaps_private.attempts WHERE expires_at < now()",
    );
    await pool.query(
      "DELETE FROM qmaps_private.sessions WHERE expires_at < now()",
    );
    for (const [key, limit] of [
      [hashToken("peer:" + peer), 90],
      [hashToken(action + ":" + handle), 12],
    ]) {
      const budget = await pool.query(
        `INSERT INTO qmaps_private.attempts VALUES ($1,now()+interval '10 minutes',1)
        ON CONFLICT(key) DO UPDATE SET attempts=qmaps_private.attempts.attempts+1
        WHERE qmaps_private.attempts.attempts < $2 RETURNING attempts`,
        [key, limit],
      );
      if (!budget.rowCount) throw new ApiError(429, "Réessayez plus tard");
    }
    if (action === "register") {
      const id = randomUUID(),
        recovery = newToken(),
        encrypted = await makeHash(pass);
      return await transaction(pool, async (db) => {
        await db.query(
          "INSERT INTO auth.users(id,raw_user_meta_data) VALUES($1,jsonb_build_object('display_name',$2::text))",
          [id, handle],
        );
        await db.query(
          "INSERT INTO qmaps_private.accounts VALUES($1,$2,$3,$4)",
          [id, handle, encrypted, hashToken(recovery)],
        );
        return { ...(await session(db, id)), handle, recovery_code: recovery };
      });
    }
    if (action === "login") {
      const { rows } = await pool.query(
        "SELECT user_id,password_hash FROM qmaps_private.accounts WHERE handle=$1",
        [handle],
      );
      if (!(await matches(pass, rows[0]?.password_hash)))
        throw new ApiError(401, "Identifiant ou mot de passe invalide");
      return await transaction(pool, async (db) => {
        const current = await db.query(
          "SELECT user_id FROM qmaps_private.accounts WHERE user_id=$1 AND password_hash=$2 FOR SHARE",
          [rows[0].user_id, rows[0].password_hash],
        );
        if (!current.rowCount) throw new ApiError(401, "Identifiants modifiés");
        return { ...(await session(db, rows[0].user_id)), handle };
      });
    }
    const recovery = newToken(),
      encrypted = await makeHash(pass);
    return await transaction(pool, async (db) => {
      const result = await db.query(
        "UPDATE qmaps_private.accounts SET password_hash=$1,recovery_hash=$2 WHERE handle=$3 AND recovery_hash=$4 RETURNING user_id",
        [encrypted, hashToken(recovery), handle, hashToken(data.recovery_code)],
      );
      if (!result.rowCount)
        throw new ApiError(401, "Identifiant ou code de récupération invalide");
      const id = result.rows[0].user_id;
      await db.query("DELETE FROM qmaps_private.sessions WHERE user_id=$1", [
        id,
      ]);
      return { ...(await session(db, id)), handle, recovery_code: recovery };
    });
  } finally {
    hashing--;
  }
}
