const merchantTab = "commerces";

export const ownedMerchantUrl = "/compte?onglet=" + merchantTab;

export function wantsOwnedMerchantTab(params: URLSearchParams) {
  return params.get("onglet") === merchantTab;
}
