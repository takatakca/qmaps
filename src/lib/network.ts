/**
 * Phase 10A — tiny network status helpers.
 *
 * Pure helpers + a thin browser-aware utility. No side effects at import.
 */

/**
 * Returns true when the browser explicitly reports that it is offline.
 * Defensive: in non-browser/SSR environments, returns false (assume online).
 */
export const isLikelyOffline = (): boolean => {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.onLine !== "boolean") return false;
  return navigator.onLine === false;
};

/**
 * Pure helper for tests. Given an explicit `online` value, returns the
 * user-facing message. Keeps copy in one place.
 */
export const offlineMessage = (online: boolean): string =>
  online
    ? "Connexion rétablie."
    : "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.";

/**
 * Pure helper: should we show the offline banner?
 * Centralized so we can extend with more conditions later.
 */
export const shouldShowOfflineBanner = (online: boolean): boolean => !online;
