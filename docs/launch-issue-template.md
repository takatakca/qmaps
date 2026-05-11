# QMAPS — Launch Issue Template (Phase 16)

Copy this block into `docs/post-launch-issue-tracker.md` for every
issue surfaced during the launch window.

---

```markdown
### Issue: <short title>

- **Date / time:** YYYY-MM-DD HH:MM (TZ)
- **Reporter:** <name or support@ ticket id>
- **Environment:** production | preview | local
- **Route / page:** /path/here
- **Steps to reproduce:**
  1. ...
  2. ...
  3. ...
- **Expected result:** ...
- **Actual result:** ...
- **Screenshot / video:** <link or attachment>
- **Severity:** critical | high | medium | low
  (use `src/lib/launchMonitoring.ts → classifyLaunchIssue`)
- **Launch blocking?** yes | no
- **Owner:** <name>
- **Fix status:** open | in progress | fixed | won't fix
- **Validation after fix:** what was re-tested and the result
- **Follow-up phase if deferred:** Phase 17 stabilization | backlog | n/a
```

---

## Quick triage rules

- **Critical** → page on-call, consider rollback per
  `docs/deploy-checklist.md` §4.
- **High** → fix in launch window; do not defer.
- **Medium / low** → log and move to `docs/post-launch-backlog.md`.
