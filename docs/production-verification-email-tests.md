> **Note du 2026-11-26 — Taktak** : Domaine hérité de l'ancienne version Lovable — la production est qmaps.ca depuis le rebuild ; adresses officielles en @qmaps.ca.

# QMAPS — Production verification email tests

_Last reviewed: 2026-11-26_

Use these templates to confirm that every public-facing QMAPS mailbox is
actively monitored. First have the mail owner confirm the destination inbox
or alias, the responsible team and the authorized external test sender.
Mark any unconfirmed destination **BLOCKED**. Once authorized, send each test
from the approved inbox **outside** the QMAPS domain, then record the result
in section **8. Support mailboxes**
of [`production-verification-log.md`](./production-verification-log.md).

Target SLA for first reply during launch week:

| Mailbox | First-reply SLA |
|---------|-----------------|
| `support@qmaps.ca` | within 1 business day |
| `privacy@qmaps.ca` | within 2 business days |
| `abuse@qmaps.ca` | within 1 business day |
| `business@qmaps.ca` | within 2 business days |
| `hello@qmaps.ca` | confirm with the owner if the Premium contact link is used |

For every test, expect:

1. The responsible team confirms that the exact test message reached its intended inbox.
2. That team replies within the agreed time.
3. Record both observations and their timestamps. DNS, the link on the site,
   and the absence of a bounce are not evidence of receipt or monitoring.

Use a unique test reference in the subject and no customer data, credentials,
payment details or attachments. Record only the verification result and a
redacted evidence link in the shared log.

---

## 1. `support@qmaps.ca` — general help

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
- Log row: section 8, row `support@qmaps.ca`.

## 2. `privacy@qmaps.ca` — privacy / data requests

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
- Log row: section 8, row `privacy@qmaps.ca`.

## 3. `abuse@qmaps.ca` — abuse / safety reports

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
- Log row: section 8, row `abuse@qmaps.ca`.

## 4. `business@qmaps.ca` — merchant questions

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
- Log row: section 8, row `business@qmaps.ca`.

---

## 5. `hello@qmaps.ca` — Premium contact

Before using this test, confirm that the Premium contact link is published,
that the inbox or alias reaches the intended team, and its reply target. If
the product does not publish this address, record **N/A** with the reason.

```
Subject: [TEST] QMAPS Premium contact inbox check

Hello,

This is a launch verification test for the Premium contact inbox.
Please reply "received". No purchase or sales follow-up is requested.

Thanks,
QMAPS verification team
```

Log row: section 8, row `hello@qmaps.ca`.

## Record the mailbox tests

- Mark **PASS** only after confirmed receipt and a human reply within the target.
- Mark **FAIL** for a bounce, delivery to the wrong inbox, or no reply within the target.
- Mark **BLOCKED** when provisioning, the responsible team or test authorization is unconfirmed.
- Add failed and blocked checks to **Owner action required** in the log.
