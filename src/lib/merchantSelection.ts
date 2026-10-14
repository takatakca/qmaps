/**
 * Preserve the selected business only when the signed-in owner's fresh
 * business list still includes it. Never synthesize or trust a stale ID.
 */
export function chooseMerchantBusiness<T extends { id: string }>(
  ownedBusinesses: readonly T[],
  currentBusinessId: string | null | undefined,
): T | null {
  return ownedBusinesses.find((business) => business.id === currentBusinessId)
    ?? ownedBusinesses[0]
    ?? null;
}
