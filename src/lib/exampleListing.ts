const exampleTitles = new Map([
  ["a9bf0001-0000-4000-8000-000000000001", "Bistro de nuit"],
  ["a9bf0001-0000-4000-8000-000000000002", "Café du quartier"],
  ["a9bf0001-0000-4000-8000-000000000003", "Atelier de services"],
]);

// The public app still reads some legacy rows. Match both the known ID and
// the seeded title so a real listing, even one named « Démo », is not changed.
export function exampleListingTitle({ id, name }: { id: string; name: string }): string | undefined {
  const title = exampleTitles.get(id);
  return title && (name === title || name === `QMAPS Démo — ${title}`) ? title : undefined;
}
