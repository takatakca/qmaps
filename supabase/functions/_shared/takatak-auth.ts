// Shared check for TAKATAK server-to-server calls.
// Set QMAPS_TAKATAK_INTEGRATION_SECRET on the function. Do not log it.

const encoder = new TextEncoder();

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export async function integrationAuthorized(request: Request): Promise<boolean> {
  const expected = Deno.env.get("QMAPS_TAKATAK_INTEGRATION_SECRET") ?? "";
  const supplied = request.headers.get("x-qmaps-integration-secret") ?? "";
  if (expected.length < 32 || supplied.length < 32) return false;
  const [left, right] = await Promise.all([sha256(expected), sha256(supplied)]);
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left[i]! ^ right[i]!;
  return mismatch === 0;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
