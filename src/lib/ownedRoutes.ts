const merchantTab = "commerces";
const reviewIntent = "avis";
const directorySource = "qmaps";

export const ownedMerchantUrl = "/compte?onglet=" + merchantTab;
export const ownedReviewUrl = "/compte?onglet=" + reviewIntent;

export function ownedListingReviewUrl(id: string) {
  return ownedReviewUrl + "&" + new URLSearchParams({ fiche: id });
}

export function ownedListingUrl(id: string) {
  return "/business/" + encodeURIComponent(id) + "?" + new URLSearchParams({ annuaire: directorySource });
}

export function wantsOwnedListing(params: URLSearchParams) {
  return params.get("annuaire") === directorySource;
}

export function wantsOwnedMerchantTab(params: URLSearchParams) {
  return params.get("onglet") === merchantTab;
}

export function wantsOwnedReview(params: URLSearchParams) {
  return params.get("onglet") === reviewIntent;
}
