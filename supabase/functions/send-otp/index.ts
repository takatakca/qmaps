import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
const VOICE_ENABLED = (Deno.env.get("TWILIO_VOICE_ENABLED") ?? "false").toLowerCase() === "true";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Normalize to E.164, defaulting to North America (+1) for 10-digit input. */
function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (hasPlus) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
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
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Non autorisé." }, 401);
    }

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
    if (!body || typeof body.phone !== "string") {
      return json({ error: "Numéro de téléphone requis." }, 400);
    }
    const channel = body.channel === "call" ? "call" : "sms";
    if (channel === "call" && !VOICE_ENABLED) {
      return json({ error: "La vérification par appel n'est pas disponible." }, 400);
    }

    const phone = toE164(body.phone);
    if (!phone) return json({ error: "Numéro de téléphone invalide." }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Rate limiting: max 1 send / 45s, 5 sends / hour per user+phone.
    const nowMs = Date.now();
    const { data: recent } = await admin
      .from("phone_verification_attempts")
      .select("created_at")
      .eq("action", "send")
      .or(`user_id.eq.${userId},phone.eq.${phone}`)
      .gte("created_at", new Date(nowMs - 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    const attempts = recent ?? [];
    if (attempts.length >= 5) {
      return json({ error: "Trop de tentatives. Réessayez dans une heure.", retryAfter: 3600 }, 429);
    }
    if (attempts.length > 0) {
      const elapsed = (nowMs - new Date(attempts[0].created_at).getTime()) / 1000;
      if (elapsed < 45) {
        return json(
          { error: "Veuillez patienter avant de redemander un code.", retryAfter: Math.ceil(45 - elapsed) },
          429,
        );
      }
    }

    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Channel: channel, Locale: "fr" }),
      },
    );
    const twilioData = await twilioRes.json().catch(() => ({}));

    await admin.from("phone_verification_attempts").insert({
      user_id: userId,
      phone,
      action: "send",
      channel,
      success: twilioRes.ok,
    });

    if (!twilioRes.ok) {
      console.error("Twilio verify send failed", twilioRes.status, twilioData?.code);
      if (twilioData?.code === 60200 || twilioData?.code === 21211) {
        return json({ error: "Numéro de téléphone invalide." }, 400);
      }
      if (twilioData?.code === 60203 || twilioRes.status === 429) {
        return json({ error: "Trop de tentatives pour ce numéro. Réessayez plus tard." }, 429);
      }
      return json({ error: "Impossible d'envoyer le code pour le moment." }, 502);
    }

    return json({ ok: true, phone, channel, cooldown: 45 });
  } catch (e) {
    console.error("send-otp error", e instanceof Error ? e.message : e);
    return json({ error: "Une erreur est survenue." }, 500);
  }
});
