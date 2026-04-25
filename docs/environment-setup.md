# QMAPS — Environment Setup Guide

_Last reviewed: 2026-04-25_

## Quick start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Replace placeholder values with real credentials from your Lovable Cloud project.
3. `.env` is already ignored by `.gitignore` — verify it is never committed.

## Required variables

| Variable | Source | Used by |
|---|---|---|
| `VITE_SUPABASE_URL` | Lovable Cloud → Settings → API | Client + edge functions |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud → Settings → API | Client auth / data |
| `VITE_SUPABASE_PROJECT_ID` | Lovable Cloud → Settings → General | Build metadata |

## Edge-function secrets (set in Lovable Cloud, not .env)

These are server-side only and must be configured via the Lovable Cloud dashboard:

- `STRIPE_SECRET_KEY` — live Stripe key (test key for preview)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook endpoint secret
- `LOVABLE_API_KEY` — auto-managed by Lovable

## Verification checklist

- [ ] `.env` exists locally and contains real values
- [ ] `.env` is listed in `.gitignore`
- [ ] No secret values appear in git history (`git log -S VITE_SUPABASE_PUBLISHABLE_KEY`)
- [ ] Edge function secrets are set in the Lovable Cloud dashboard
- [ ] `bun run build` succeeds with the current `.env`
