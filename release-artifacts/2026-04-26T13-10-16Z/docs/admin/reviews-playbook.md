# Admin playbook — Reviews moderation

_Phase 11. Internal use only._

## Scope
Moderation of `reviews` and related signals via `/admin/review-moderation`,
`/admin/reviews`, and `/admin/reports`.

## Daily routine
1. Open `/admin/review-moderation` and sort by highest risk score.
2. Review top 20 items flagged by `analyze-review-risk`.
3. For each item:
   - Read review body, check `review_moderation_signals` explanations.
   - Cross-check the reporter context in `/admin/reports` if relevant.
   - Decide: **approve**, **hide**, or **escalate**.
4. Log decision — the action is automatically written to
   `review_moderation_actions` (immutable audit).

## Decision matrix

| Signal severity | Action |
|-----------------|--------|
| `low` | Auto-approve unless a user report exists |
| `medium` | Manual review, default to approve with note |
| `high` | Hide pending investigation, contact author if needed |
| `critical` | Hide immediately, escalate to lead moderator |

## Hiding a review
- Use the **Hide** action in `/admin/review-moderation`.
- Always set `hidden_reason` (free-text, internal).
- Hidden reviews remain in the database; they are excluded from public
  ratings via the existing trigger.

## Never delete
- Do **not** delete rows from `reviews`. Hiding preserves audit trail.
- Do **not** delete `review_moderation_actions` or `review_trust_scores`.

## Escalation
- DMCA / legal: forward to `abuse@qmaps.app` with review id and URL.
- Suspected coordinated abuse: open a thread in the moderation channel
  and tag the lead moderator before bulk-hiding.

## SLAs
- Critical signals: under 4 hours.
- High signals: under 24 hours.
- Medium / low: weekly sweep.
