/**
 * Selection is only a UI preference, never an authorization credential.
 * Every consuming screen MUST query rows scoped to auth.uid() first and then
 * choose among the returned, actually-owned businesses.
 */
export function chooseMerchantBusiness<T extends { id: string }>(
  ownedBusinesses: readonly T[],
  currentBusinessId: string | null | undefined,
): T | null {
  return ownedBusinesses.find((business) => business.id === currentBusinessId)
    ?? ownedBusinesses[0]
    ?? null;
}

/** Scoped by user ID to prevent another account inheriting the previous UI choice. */
export function merchantBusinessPreferenceKey(ownerUserId: string): string {
  return `qmaps:merchant:selected-business:${ownerUserId}`;
}

export function getSavedMerchantBusinessId(ownerUserId: string): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(merchantBusinessPreferenceKey(ownerUserId));
  } catch {
    return null; // Session storage may be disabled (private browsing).
  }
}

export function saveMerchantBusinessId(ownerUserId: string, businessId: string): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(merchantBusinessPreferenceKey(ownerUserId), businessId);
    }
  } catch {
    // Persistence is optional: never break merchant flows if storage is blocked.
  }
}
