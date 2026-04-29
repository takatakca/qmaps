# QMAPS — Production verification: Mobile / PWA

_Last reviewed: 2026-04-26_

Real-device verification steps for QMAPS on Android and iOS. Pair with
section **9. Mobile / PWA install** of
[`production-verification-log.md`](./production-verification-log.md) and
the broader [`mobile-qa-checklist.md`](./mobile-qa-checklist.md).

> Use the live production URL (`https://qmaps.app`) — not the preview
> URL. Capture a screenshot for each test and link it from the log.

---

## 1. Android Chrome — install prompt

Device: a real Android phone running current Chrome.

1. Open `https://qmaps.app` in Chrome.
2. Browse two pages so the install heuristic triggers.
3. Open the Chrome menu → **Install app** (or **Add to Home screen**).
4. Confirm the prompt shows the QMAPS name and the maskable icon.
5. Install. Find the QMAPS icon on the home screen / drawer.

Record in log: rows "Android Chrome install prompt" and
"Android standalone launch".

## 2. Android — standalone launch

1. Tap the installed QMAPS icon.
2. Confirm it launches **without** the Chrome address bar (standalone).
3. Confirm the splash / theme color matches the brand.
4. Sign in and complete a search to confirm the app is functional in
   standalone mode.

## 3. iOS — Add to Home Screen

Device: a real iPhone running current Safari.

1. Open `https://qmaps.app` in Safari.
2. Tap **Share → Add to Home Screen**.
3. Confirm the suggested name is `QMAPS` and the icon is the
   apple-touch-icon (no white square).
4. Tap **Add**, then launch from the home screen.
5. Confirm it opens in standalone mode (no Safari chrome).

Record in log: row "iOS Add to Home Screen".

## 4. Safe-area / bottom nav check

On both Android and iOS:

1. With the PWA open, confirm the bottom navigation sits **above** the
   system gesture bar / home indicator (no overlap).
2. Rotate to landscape and confirm the nav still respects safe areas.
3. Open a sheet (e.g. filters) and confirm action buttons are reachable
   above the keyboard or system UI.

Record in log: row "Bottom nav respects safe-area".

## 5. No autozoom on input focus (iOS)

1. On iPhone Safari, open the search bar on `/search`.
2. Tap the input. The page must **not** zoom in.
3. Repeat with the auth form's email/password inputs.

Record in log: row "No autozoom on input focus".

## 6. Offline banner test

1. Load `https://qmaps.app` once while online.
2. Enable airplane mode (or disable WiFi + cellular).
3. Trigger any navigation or refresh.
4. Confirm the offline banner appears at the top of the page.
5. Re-enable connectivity and confirm the banner disappears.

Record in log: row "Offline banner appears offline".

---

## Failure handling

- Mark a row **FAIL** if the behavior diverges (no prompt, wrong icon,
  autozoom, banner missing).
- If a real device is not available yet, mark the row **BLOCKED** and
  list it in the **Owner action required** section of the log.
- File any FAIL in
  [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md).
