# Work log

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

2026-10-15 | ChatGPT | main | code ready, CI pending | Hardened cross-business Stripe subscription fetch race and failure state, removed false $0 balance and fabricated due date, blocked checkout during errors | Run CI, test real Stripe and subscriptions when QMAPS backend accessible

2026-10-15 | ChatGPT | main | implemented, CI pending | Removed invented merchant review recommendation claims and dead buttons; real empty state links to business editor; tested reply action in React | Verify CI, continue identity-safe billing

2026-10-14 | ChatGPT | main | handoff snapshot, current CI pending | Updated canonical 5 status/handoff files with last code SHA, green CI evidence, exact Supabase/hosting blockers and next actionable steps | Check latest CI on main, resume issue #6 after authorized QMAPS project and host access

2026-10-14 | ChatGPT | main | code ready, CI pending | Ensured resumed merchant draft entitlement is verified before setting is_active true, preventing user role failures from appearing as successful publication | Run CI, test real entitlement policy

2026-10-14 | ChatGPT | main | code ready, CI pending | Made merchant onboarding resumable after interrupted draft and checked category writes/RLS before publication | Validate CI, verify resume and category failure scenarios against real QMAPS DB

2026-10-14 | ChatGPT | main | code ready, CI pending | Fixed merchant review fetch silent failures/infinite loading, added retry and barred previous business reviews from overview | Validate CI and two-business review loading

2026-10-14 | ChatGPT | main | code ready, CI pending | Prevented stale sponsored-campaign results from crossing merchant selection; added explicit Supabase read errors and retry to optimization page | Validate CI and test live campaigns switching

2026-10-14 | ChatGPT | main | code ready, CI pending | Replaced simulated merchant ad optimization with real owned-business sponsored campaign counts/statuses and links to live workflows | Validate CI and review campaign data access in QMAPS production

2026-10-14 | ChatGPT | main | code ready, CI pending | Propagated owner-validated selected business to merchant inbox/messages, menu, optimization, services and sponsored campaign pages | Verify CI and multi-merchant production QA

2026-10-14 | ChatGPT | main | code ready, CI pending | Extended user-scoped selected business across merchant photos, company info, menu, ads, billing/checkout, home, marketplace and analytics, verified against owned rows | Validate CI and end-to-end switching across two businesses

2026-10-14 | ChatGPT | main | code ready, Supabase deployment blocked | Added INSERT+UPDATE guards for hidden-review moderation fields, spoofed reaction counters, and review author/business reassignment | Validate CI, then apply SQL only in QMAPS and exercise live RLS negative tests

2026-10-14 | ChatGPT | main | code ready, QMAPS DB access blocked | Added admin/service-only INSERT+UPDATE guards against forged verified-owner flags and rating aggregates; regression coverage | Verify CI then apply SQL on QMAPS project only

2026-10-14 | ChatGPT | main | documentation updated | Latest code SHA 23aa06e4 CI green including typecheck; recorded P0 external deployment issue #6 and updated 5 standard handoff files | Continue from exact GitHub main SHA; unblock real Supabase QMAPS and host/DNS evidence

2026-10-14 | ChatGPT | main | code ready, typecheck CI pending | Added explicit tsc noEmit typecheck to GitHub CI and package scripts | Resolve any TypeScript errors found by latest CI

2026-10-14 | ChatGPT | main | code ready, CI pending | Made real business city mandatory in AddBusiness to prevent erroneous Montreal fallback; clarified owner choice | Review CI and production mapping

2026-10-14 | ChatGPT | main | done in code, CI pending | Added working review rating filter, text expansion and photo navigation; removed false author counts and inactive check-in control | Review CI and mobile UX, continue production tasks

2026-10-14 | ChatGPT | main | done in code, verification pending | Kept merchant onboarding drafts inactive until explicit successful owner-scoped publish; added tests | Check CI and real Supabase RLS before launch

2026-10-14 | ChatGPT | main | code ready, DB migration pending | Fixed merchant onboarding is_claimed mismatch with RLS, prepared nullable coordinates/removed fake Montreal defaults, typed nullable fields | CI then deploy SQL only to the confirmed QMAPS Supabase project

2026-10-14 | ChatGPT | main | code ready, verification pending | Removed fake merchant business auto-insert, wired new listings to real AddBusiness form and merchant return route | Validate CI, continue production integration

2026-10-14 | ChatGPT | main | done in code, CI pending | Removed fake merchant hours/discounts/badges and inactive buttons, used actual hours and phone/photo actions | Validate CI and mobile UI; continue production readiness

2026-10-14 | ChatGPT | main | code ready, deploy opt-in remains off | Added exact SHA publishing verification and stale-CI deployment rejection with contract tests | Check CI, activate only after confirmed hosting/DNS/SSH secrets

2026-10-14 | ChatGPT | main | code ready, migration pending | Prevent review/TAKATAK spoofing on INSERT and foreign owner assignment; hide stale tenant reviews before next render | Validate CI, apply new SQL only on correct QMAPS Supabase project

2026-10-14 | ChatGPT | main | done in code, verification pending | Added multi-business merchant selection, stale review protection, unit tests, five canonical status/handoff docs | Validate CI on latest SHA and continue with Supabase and hosting readiness

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
