# Admin playbook — Business claims

_Phase 11. Internal use only._

## Scope
Approving / rejecting `business_claims` from `/admin/businesses`.

## Verification checklist (before approving)
- [ ] The claim note references a verifiable proof of ownership
      (business email, domain, public phone match, official document).
- [ ] The user account email aligns with the business domain when applicable.
- [ ] No pending fraud report exists against the user
      (`reports.target_type = 'user'`, `status = 'open'`).
- [ ] Business is not already actively claimed by another verified owner.

If verification fails, **reject** with a short note explaining the missing
evidence so the user can re-submit.

## Approval flow
The admin UI handles this in three steps automatically:
1. `businesses.owner_user_id = claim.user_id` and `is_claimed = true`.
2. `business_claims.status = 'approved'`.
3. Insert `user_roles (user_id, role = 'merchant')`.

Confirm afterwards that the user can sign in to `/merchant` and access
`/merchant/dashboard`.

## Rejecting
- Set `business_claims.status = 'rejected'`.
- Communicate the reason to the user via `support@qmaps.app`.
- Keep the row — do not delete (audit trail).

## Disputes
If two users claim the same business:
1. Pause both claims (leave `pending`).
2. Request government registration / utility bill from each.
3. Approve the strongest evidence; reject the other with explanation.

## Transferring ownership
For account closure or sale:
1. Identify new owner (must have a QMAPS account).
2. Update `businesses.owner_user_id` via a manual migration (admins only).
3. Add `user_roles` row for the new owner.
4. Optionally remove the previous merchant role if they no longer own
   any business.

## Never
- Do not auto-strip `owner_user_id` when a user requests account deletion
  — see `docs/account-deletion-support-workflow.md` §5.
- Do not delete `business_claims` rows.
