# QMAPS — Production verification email tests

_Last reviewed: 2026-04-26_

Use these templates to confirm that every public-facing QMAPS mailbox is
actively monitored. Send each test from a personal inbox **outside** the
QMAPS domain, then record the result in section **8. Support mailboxes**
of [`production-verification-log.md`](./production-verification-log.md).

Target SLA for first reply during launch week:

| Mailbox | First-reply SLA |
|---------|-----------------|
| `support@qmaps.app` | within 1 business day |
| `privacy@qmaps.app` | within 2 business days |
| `abuse@qmaps.app` | within 1 business day |
| `business@qmaps.app` | within 2 business days |

For every test, expect:

1. A non-bounce delivery (no `mailer-daemon` reply).
2. A human acknowledgement within the SLA above.
3. A row added to the relevant playbook tracker (reviews, billing,
   account deletion, etc.) if the test triggers a real workflow.

---

## 1. `support@qmaps.app` — general help

```
Subject: [TEST] QMAPS support inbox check

Hi QMAPS team,

This is a launch verification test from the on-call team. Please reply
"received" so we can confirm the support inbox is monitored.

Thanks,
<verifier name>
```

**Triage notes**

- Owner: support team.
- Expected response: simple acknowledgement.
- Log row: section 8, row `support@qmaps.app`.

## 2. `privacy@qmaps.app` — privacy / data requests

```
Subject: [TEST] QMAPS privacy inbox check

Hi,

Launch verification test for the privacy mailbox. Please reply
"received" — no action required. We will not be filing a real DSAR.

Thanks,
<verifier name>
```

**Triage notes**

- Owner: privacy / DPO contact.
- If a real DSAR or deletion request arrives during launch week, route
  it through [`account-deletion-support-workflow.md`](./account-deletion-support-workflow.md).
- Log row: section 8, row `privacy@qmaps.app`.

## 3. `abuse@qmaps.app` — abuse / safety reports

```
Subject: [TEST] QMAPS abuse inbox check

Hi,

This is a launch verification test for the abuse mailbox. No real abuse
report is included. Please reply "received".

Thanks,
<verifier name>
```

**Triage notes**

- Owner: trust & safety lead.
- Real reports go to `/admin/reports` after triage; see
  [`admin/reviews-playbook.md`](./admin/reviews-playbook.md).
- Log row: section 8, row `abuse@qmaps.app`.

## 4. `business@qmaps.app` — merchant questions

```
Subject: [TEST] QMAPS business inbox check

Hi,

Launch verification test for the merchant inbox. Please reply
"received" — no claim or billing action requested.

Thanks,
<verifier name>
```

**Triage notes**

- Owner: business / partnerships team.
- Real claim requests go through
  [`admin/business-claims-playbook.md`](./admin/business-claims-playbook.md).
- Real billing questions go through
  [`admin/billing-playbook.md`](./admin/billing-playbook.md).
- Log row: section 8, row `business@qmaps.app`.

---

## After all four mailbox tests

- Mark each row in the log as PASS / FAIL / BLOCKED.
- If any mailbox bounced or was silent past the SLA, flip the row to
  **BLOCKED** and add it to the **Owner action required** section of
  the log.
