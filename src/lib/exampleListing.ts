import { exampleListings } from "./ownedListingIdentity.mjs";

const exampleTitles = new Map<string, string>(Object.entries(exampleListings));

// The public app still reads some legacy rows. Match both the known ID and
// the seeded title so a real listing, even one named « Démo », is not changed.
export function exampleListingTitle({ id, name }: { id: string; name: string }): string | undefined {
  const title = exampleTitles.get(id);
  return title && (name === title || name === `QMAPS Démo — ${title}`) ? title : undefined;
}
