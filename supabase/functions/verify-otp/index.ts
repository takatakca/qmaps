import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlus) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      return json({ error: "La vérification par téléphone n'est pas configurée." }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé." }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await anon.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claimsData?.claims) return json({ error: "Non autorisé." }, 401);
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => null);
    if (!body || typeof body.phone !== "string" || typeof body.code !== "string") {
      return json({ error: "Numéro et code requis." }, 400);
    }
    const phone = toE164(body.phone);
    const code = body.code.replace(/\D/g, "");
    if (!phone) return json({ error: "Numéro de téléphone invalide." }, 400);
    if (code.length < 4 || code.length > 10) return json({ error: "Code invalide." }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Brute-force guard: max 6 failed checks per 15 minutes.
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: failedCount } = await admin
      .from("phone_verification_attempts")
      .select("id", { count: "exact", head: true })
      .eq("action", "verify")
      .eq("success", false)
      .or(`user_id.eq.${userId},phone.eq.${phone}`)
      .gte("created_at", since);

    if ((failedCount ?? 0) >= 6) {
      return json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, 429);
    }

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      },
    );

    const payload = await twilioRes.json().catch(() => ({}));
    const approved = twilioRes.ok && payload?.status === "approved";

    await admin.from("phone_verification_attempts").insert({
      user_id: userId,
      phone,
      action: "verify",
      channel: "sms",
      success: approved,
    });

    if (!approved) {
      if (!twilioRes.ok) {
        console.error("Twilio VerificationCheck failed", twilioRes.status, payload?.code);
      }
      return json({ error: "Code invalide ou expiré." }, 400);
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ phone, phone_verified_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("profile phone update failed", updateError);
      return json({ error: "Impossible d'enregistrer le numéro." }, 500);
    }

    return json({ ok: true, verified: true, phone });
  } catch (err) {
    console.error("verify-otp error", err instanceof Error ? err.message : "Unknown error");
    return json({ error: "Erreur inattendue." }, 500);
  }
});
