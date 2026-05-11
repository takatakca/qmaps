# Security Hardening Notes (Phase 15H)

## Fixed in this phase
- **Categories table**: Added admin-only `INSERT` and `UPDATE` RLS policies. Public read remains.
- **Reviews table**: Added admin-only `UPDATE` RLS policy so admins can hide/restore/mark reviewed without bypassing RLS.
- **Categories trigger**: Added `categories_prevent_self_parent` trigger with explicit `SET search_path = public` to block self-parenting at the DB level.
- **Categories `updated_at` trigger**: Reuses existing `update_updated_at_column()` helper.

## Deferred (infrastructure / hosting)
These warnings appear in the Supabase linter but are intentionally left untouched in this phase to avoid breaking dependent app behavior or destabilizing the database:

| Warning | Why deferred | Recommended future action |
|---|---|---|
| `RLS Disabled in Public` on `spatial_ref_sys` | Owned by the PostGIS extension; modifying it can break PostGIS upgrades. | Coordinate with infra; relocate PostGIS to a `extensions` schema in a maintenance window. |
| `Extension in Public` (PostGIS, pg_trgm) | Both are heavily used by search/geo. Moving them requires re-creating dependent indexes and functions. | Schedule a dedicated migration to move extensions to a non-public schema. |
| `Public Can Execute SECURITY DEFINER Function` (multiple) | Functions like `has_role`, `user_owns_business`, `is_conversation_participant`, `can_access_quote`, `user_serves_category` are intentionally callable so RLS policies can use them. Revoking EXECUTE would break policies. | Audit each function individually and tighten only those not referenced by RLS. |
| Postgres version upgrade available | Hosting-level operation, requires a maintenance window. | Schedule via Lovable Cloud / Supabase upgrade flow. |

## Auditing
All Phase 15H admin actions on categories and reviews are written to `admin_audit_logs` via `buildAdminAuditLogPayload` (see `src/lib/adminAudit.ts`). Actions added:
- `category_created`, `category_updated`, `category_deactivated`, `category_reactivated`
- `review_hidden`, `review_restored`, `review_reviewed`
