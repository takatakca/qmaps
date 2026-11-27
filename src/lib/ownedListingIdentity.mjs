export const directorySource = "qmaps";

export const exampleListings = Object.freeze({
  "a9bf0001-0000-4000-8000-000000000001": "Bistro de nuit",
  "a9bf0001-0000-4000-8000-000000000002": "Café du quartier",
  "a9bf0001-0000-4000-8000-000000000003": "Atelier de services",
});

export function ownedListingPermalink(id) {
  return "/business/" + encodeURIComponent(id) + "?" + new URLSearchParams({ annuaire: directorySource });
}
