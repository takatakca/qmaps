export interface ServiceArea {
  business_id: string;
  city: string | null;
  region: string | null;
  postal_code_prefix: string | null;
}

export interface MatchLocation {
  city: string | null;
  region: string | null;
  postalCode: string | null;
}

export type MatchScope = "postal" | "city" | "region" | "unrestricted";

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("fr-CA");
}

function postal(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

export function matchBusinessAreas(
  businessId: string,
  allAreas: ServiceArea[],
  location: MatchLocation,
): { matches: boolean; scope: MatchScope } {
  const areas = allAreas.filter((area) => area.business_id === businessId);
  if (areas.length === 0) {
    return { matches: true, scope: "unrestricted" };
  }

  let best: MatchScope | null = null;

  for (const area of areas) {
    const hasCity = Boolean(area.city?.trim());
    const hasRegion = Boolean(area.region?.trim());
    const hasPostal = Boolean(area.postal_code_prefix?.trim());

    if (!hasCity && !hasRegion && !hasPostal) {
      return { matches: true, scope: "unrestricted" };
    }

    const cityOk =
      !hasCity || normalized(area.city) === normalized(location.city);
    const regionOk =
      !hasRegion || normalized(area.region) === normalized(location.region);
    const postalOk =
      !hasPostal || postal(location.postalCode).startsWith(postal(area.postal_code_prefix));

    if (!(cityOk && regionOk && postalOk)) continue;

    if (hasPostal) best = "postal";
    else if (hasCity && best !== "postal") best = "city";
    else if (hasRegion && !best) best = "region";
  }

  return best
    ? { matches: true, scope: best }
    : { matches: false, scope: "unrestricted" };
}

export function matchScopeScore(scope: MatchScope): number {
  if (scope === "postal") return 3;
  if (scope === "city") return 2;
  if (scope === "region") return 1;
  return 0;
}
