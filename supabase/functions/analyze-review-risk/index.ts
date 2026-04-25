// Phase 9E — analyze-review-risk
//
// Deterministic-first review risk scorer. Optionally calls Lovable AI Gateway
// when AI_REVIEW_ANALYSIS_ENABLED=true. Never auto-deletes. Only auto-hides
// when REVIEW_AUTO_HIDE_ENABLED=true AND risk_level=critical.
//
// Auth: requires a valid Supabase JWT (any signed-in user can request scoring
// of an existing review). All writes are performed with the service role.
//
// Environment variables (all optional except SUPABASE_SERVICE_ROLE_KEY):
//   AI_REVIEW_ANALYSIS_ENABLED  "true" to allow the optional AI layer.
//                               Default "false" (deterministic rules only).
//   LOVABLE_API_KEY             Auto-provisioned by Lovable AI gateway. If
//                               missing the function returns rules-only,
//                               never throwing or breaking review publishing.
//   REVIEW_AUTO_HIDE_ENABLED    "true" to auto-hide critical-risk reviews.
//                               Default "false". High-risk never auto-hides;
//                               it only sets moderation_status=needs_review.
//   SUPABASE_SERVICE_ROLE_KEY   Required for DB writes (signals, trust,
//                               moderation_status). Without it the function
//                               returns a safe rules-only JSON envelope and
//                               does NOT throw — review publishing keeps
//                               working regardless.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";

const AI_ENABLED = (Deno.env.get("AI_REVIEW_ANALYSIS_ENABLED") ?? "false").toLowerCase() === "true";
const AUTO_HIDE = (Deno.env.get("REVIEW_AUTO_HIDE_ENABLED") ?? "false").toLowerCase() === "true";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

// ---- Severity / weights (mirrors src/lib/reviewTrust.ts) ----
type Severity = "low" | "medium" | "high" | "critical";
type SignalType =
  | "duplicate_text"
  | "repeated_phrase"
  | "extreme_rating"
  | "new_account"
  | "burst_activity"
  | "review_velocity"
  | "same_business_pattern"
  | "short_low_context"
  | "suspicious_language"
  | "merchant_conflict"
  | "user_reported"
  | "ai_flagged"
  | "admin_flagged"
  | "trusted_history";

const WEIGHTS: Record<SignalType, number> = {
  duplicate_text: 35,
  repeated_phrase: 15,
  extreme_rating: 10,
  new_account: 12,
  burst_activity: 20,
  review_velocity: 15,
  same_business_pattern: 25,
  short_low_context: 8,
  suspicious_language: 12,
  merchant_conflict: 18,
  user_reported: 10,
  ai_flagged: 20,
  admin_flagged: 40,
  trusted_history: -25,
};
const SEV_MULT: Record<Severity, number> = { low: 0.5, medium: 1, high: 1.5, critical: 2 };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const riskLevel = (score: number): Severity => {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
};

interface Signal {
  signal_type: SignalType;
  severity: Severity;
  score: number;
  explanation: string;
  metadata?: Record<string, unknown>;
}

const composeRisk = (signals: Signal[]) => {
  let raw = 0;
  for (const sig of signals) {
    const base = WEIGHTS[sig.signal_type] ?? 0;
    const mult = SEV_MULT[sig.severity] ?? 1;
    raw += sig.score && sig.score !== 0 ? sig.score : base * mult;
  }
  const risk_score = clamp(Math.round(raw), 0, 100);
  return {
    risk_score,
    trust_score: Number(((100 - risk_score) / 100).toFixed(3)),
    risk_level: riskLevel(risk_score),
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const reviewId = String(body?.review_id ?? "");
    const force = Boolean(body?.force);
    if (!reviewId) {
      return new Response(JSON.stringify({ error: "missing_review_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "service_role_missing", source: "rules", risk_score: 0, risk_level: "low", signals: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Idempotency: skip if already scored within 5 min unless force
    if (!force) {
      const { data: existing } = await admin
        .from("review_trust_scores")
        .select("review_id, updated_at, risk_score, risk_level")
        .eq("review_id", reviewId)
        .maybeSingle();
      if (existing) {
        const ageMs = Date.now() - new Date(existing.updated_at as string).getTime();
        if (ageMs < 5 * 60 * 1000) {
          return new Response(
            JSON.stringify({ source: "cached", ...existing }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Fetch review + context
    const { data: review, error: reviewErr } = await admin
      .from("reviews")
      .select("id, body, rating, user_id, business_id, created_at")
      .eq("id", reviewId)
      .maybeSingle();
    if (reviewErr || !review) {
      return new Response(JSON.stringify({ error: "review_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reviewer account age — use getUserById (supported), never throw.
    let userCreatedAt: string | null = null;
    try {
      const { data: userRes } = await admin.auth.admin.getUserById(review.user_id);
      userCreatedAt = (userRes?.user as any)?.created_at ?? null;
    } catch (_e) {
      // Treat as unknown account age. new_account signal will simply not fire.
      userCreatedAt = null;
    }

    // User's recent reviews (24h burst)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: userBurst } = await admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", review.user_id)
      .gte("created_at", since);

    const { count: userTotal } = await admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", review.user_id);

    // Same-business burst
    const { count: bizBurst } = await admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", review.business_id)
      .gte("created_at", since);

    // Duplicate body by same user
    let dupeCount = 0;
    if (review.body) {
      const { count } = await admin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", review.user_id)
        .eq("body", review.body)
        .neq("id", reviewId);
      dupeCount = count ?? 0;
    }

    // ---- Deterministic signals ----
    const signals: Signal[] = [];
    const text = (review.body ?? "").toString();
    const rating = Number(review.rating ?? 0);

    if ((rating === 1 || rating === 5) && text.length > 0 && wordCount(text) <= 5) {
      signals.push({
        signal_type: "extreme_rating",
        severity: "medium",
        score: 0,
        explanation: "Note extrême avec très peu de contexte.",
      });
      signals.push({
        signal_type: "short_low_context",
        severity: "low",
        score: 0,
        explanation: `Avis de ${wordCount(text)} mot(s).`,
      });
    } else if (text.length > 0 && wordCount(text) <= 3) {
      signals.push({
        signal_type: "short_low_context",
        severity: "low",
        score: 0,
        explanation: "Avis très court.",
      });
    }

    if (userCreatedAt) {
      const ageH = (Date.now() - new Date(userCreatedAt).getTime()) / 36e5;
      if (ageH >= 0 && ageH < 24) {
        signals.push({
          signal_type: "new_account",
          severity: rating === 1 || rating === 5 ? "high" : "medium",
          score: 0,
          explanation: "Compte créé il y a moins de 24 h.",
        });
      } else if (ageH < 24 * 7) {
        signals.push({
          signal_type: "new_account",
          severity: "low",
          score: 0,
          explanation: "Compte créé il y a moins de 7 jours.",
        });
      }
    }

    const ub = Number(userBurst ?? 0);
    if (ub >= 5) {
      signals.push({
        signal_type: "burst_activity",
        severity: "high",
        score: 0,
        explanation: `Utilisateur a publié ${ub} avis dans les 24 dernières heures.`,
      });
    } else if (ub >= 3) {
      signals.push({
        signal_type: "review_velocity",
        severity: "medium",
        score: 0,
        explanation: `Utilisateur a publié ${ub} avis dans les 24 dernières heures.`,
      });
    }

    const bb = Number(bizBurst ?? 0);
    if (bb >= 10) {
      signals.push({
        signal_type: "same_business_pattern",
        severity: "high",
        score: 0,
        explanation: `${bb} avis sur ce commerce dans les 24 dernières heures.`,
      });
    }

    if (dupeCount >= 2) {
      signals.push({
        signal_type: "duplicate_text",
        severity: dupeCount >= 4 ? "critical" : "high",
        score: 0,
        explanation: `Texte identique posté ${dupeCount} fois par cet utilisateur.`,
      });
    }

    const ut = Number(userTotal ?? 0);
    if (ut >= 25 && ub <= 1) {
      signals.push({
        signal_type: "trusted_history",
        severity: "low",
        score: 0,
        explanation: `Historique fiable: ${ut} avis publiés.`,
      });
    }

    // ---- Optional AI layer ----
    let aiUsed = false;
    if (AI_ENABLED && LOVABLE_API_KEY && text.length > 0) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are a review-trust analyst. Reply ONLY in JSON: {\"suspicious\":boolean,\"reason\":string,\"severity\":\"low|medium|high|critical\"}. Be conservative; flag only obvious spam, fake-sounding, generic, or coordinated language.",
              },
              {
                role: "user",
                content: `Rating: ${rating}\nReview text: ${text.slice(0, 1500)}`,
              },
            ],
          }),
        });
        if (aiRes.ok) {
          const json = await aiRes.json();
          const raw = json?.choices?.[0]?.message?.content ?? "";
          const cleaned = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed?.suspicious) {
            const sev: Severity =
              ["low", "medium", "high", "critical"].includes(parsed.severity)
                ? parsed.severity
                : "medium";
            signals.push({
              signal_type: "ai_flagged",
              severity: sev,
              score: 0,
              explanation: String(parsed.reason ?? "Marqué par l'analyse IA.").slice(0, 400),
              metadata: { ai_model: "google/gemini-2.5-flash" },
            });
            aiUsed = true;
          }
        }
      } catch (e) {
        console.log("AI analysis failed, falling back to rules", e);
      }
    }

    const composed = composeRisk(signals);
    const computed_by = aiUsed ? "rules+ai" : "rules";
    const status: string =
      composed.risk_level === "critical"
        ? AUTO_HIDE
          ? "hidden"
          : "needs_review"
        : composed.risk_level === "high"
        ? "needs_review"
        : "visible";

    // Replace prior signals (best-effort)
    await admin.from("review_moderation_signals").delete().eq("review_id", reviewId);
    if (signals.length > 0) {
      const toInsert = signals.map((s) => ({
        review_id: reviewId,
        signal_type: s.signal_type,
        severity: s.severity,
        score: s.score,
        explanation: s.explanation,
        metadata: s.metadata ?? {},
      }));
      await admin.from("review_moderation_signals").insert(toInsert);
    }

    // Upsert trust score
    await admin
      .from("review_trust_scores")
      .upsert(
        {
          review_id: reviewId,
          trust_score: composed.trust_score,
          risk_score: composed.risk_score,
          risk_level: composed.risk_level,
          status,
          summary:
            signals.length === 0
              ? "Aucun signal détecté."
              : signals.map((s) => `${s.signal_type}:${s.severity}`).join(", "),
          computed_by,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "review_id" }
      );

    if (status === "hidden" && AUTO_HIDE) {
      await admin
        .from("reviews")
        .update({
          moderation_status: "hidden",
          hidden_at: new Date().toISOString(),
          hidden_reason: "auto_hidden_critical_risk",
        })
        .eq("id", reviewId);
    } else if (status === "needs_review") {
      await admin
        .from("reviews")
        .update({ moderation_status: "needs_review" })
        .eq("id", reviewId);
    }

    return new Response(
      JSON.stringify({
        source: computed_by,
        review_id: reviewId,
        risk_score: composed.risk_score,
        risk_level: composed.risk_level,
        trust_score: composed.trust_score,
        status,
        signals,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-review-risk error", e);
    return new Response(
      JSON.stringify({ error: "internal_error", source: "rules", risk_score: 0, risk_level: "low", signals: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
