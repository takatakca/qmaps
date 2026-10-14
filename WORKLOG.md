# Work log

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

2026-10-14 | ChatGPT | main | done | Extended TAKATAK CI to run Deno TypeScript check of verified merchant reply Edge Function | Confirm checks pass before a live Supabase Edge deployment

2026-10-14 | ChatGPT | main | done | Fixed reply text normalization and merchant dashboard branding from FLEXS to QMAPS | Verify GitHub CI and production Edge deployment prerequisites

2026-10-14 | ChatGPT | main | code ready, deployment pending | Added verified JWT merchant-review reply endpoint and reply UI; SQL guards prevent authors faking replies and merchants hijacking TAKATAK workspaces | Run database migration in QMAPS environment then deploy merchant-reply-review and manually verify customer isolation

2026-10-14 | ChatGPT | main | done | Locked QMAPS SSH deploy to enabled opt-in + main/CI success + qmaps.ca HTTPS and hardened trailing-dot origin validation | Verify CI and deploy only after host and secrets are confirmed

2026-10-14 | ChatGPT | main | done | Hardened Stripe Checkout and Billing Portal redirect origins using a server-controlled HTTPS allowlist plus unit tests | Add verified legacy/staging domains in Edge Function secrets only if needed, confirm payments in a real environment

2026-10-14 | ChatGPT | main | done (code only) | Updated qmaps.ca SEO/sitemap, repository README and GitHub-to-SSH deployment workflow with opt-in gate | Verify real hosting, supply secrets, activate deployment, check production end-to-end

2026-10-14 | ChatGPT | main (merge PR #2) | done | Added HMAC-authenticated TAKATAK candidate lookup; fails closed when query bounds are reached; addressed Deno BufferSource type error | Configure server-only secrets, deploy function, and verify signed requests before declaring production-ready

2026-10-14 | ChatGPT | main (merge PR #4 + #3) | done | Integrated green-CI typing fixes, TAKATAK workspace link, and merchant review replies while retaining PR #5 security cleanup | Database migration and integration secrets remain deployment prerequisites
2026-10-11 | cursor | cursor/qmaps-takatak-bridge → PR #4 | done (merged into main) | TAKATAK workspace association and owner reply API with reviewed changes | Apply database migration separately after deployment readiness
2026-10-11 | cursor | cursor/qmaps-lint-explicit-any → PR #3 | done (included via PR #4) | Replace explicit anys, fix lint and go/no-go script | Watch GitHub CI on main
2026-10-14 | ChatGPT | chore/continuation-security-handoff → PR #5 | done (merged into main) | Added `.agent/CONTINUATION.md` handoff and removed committed `.env` without reading it | Codex runs full checks, reviews secret rotation, then merge if safe
2026-10-09 | Lovable | managed workspace → no PR | done | Added 6 more visual option boards (search+map, onboarding, city page, mobile screens, notifications, about page), boards 16-21 in Files; no code changes | Owner picks favorites; no publishing
2026-10-09 | Lovable | managed workspace → no PR | done | Added 6 more visual option boards (dark mode, editorial categories, dark business page, profile, winter hero, light merchant portal), boards 10-15 in Files; no code changes | Owner picks favorites; no publishing
2026-10-09 | Lovable | managed workspace → no PR | done | Delivered 12 QMaps visual concepts across 3 image boards; no application code changes | Owner can select visual directions; no publishing
- 2026-10-08 | claude (owner setup) | default branch | done | Added the work log rule, this log and the stop reminder | every agent follows AGENTS.md › Work log rule
