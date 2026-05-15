// Phase 4 — Structured merchant attributes.
//
// Storage model:
//   businesses.attributes (jsonb) — structured, per-key state:
//     {
//       "boolean": { "Wheelchair Accessible": true, "Drive-Thru": false, ... },
//       "single":  { "alcohol": "Full Bar", "wifi": "Free", ... },
//       "multi":   { "accepted_cards": ["Credit","Debit"], "parking": ["Valet"] }
//     }
//
// Backward compatibility:
//   - Reads fall back to the legacy flat `amenities` text array when
//     `attributes` is empty ({}), so pre-Phase-4 businesses still display
//     correctly on public pages.
//   - Writes always mirror the structured state into the legacy `amenities`
//     array as well, so any code still reading `amenities` keeps working.

export type AttributeGroupKind = "boolean" | "single" | "multi";

export interface AttributeOption {
  /** Stable storage key. For boolean groups this is also the public label. */
  key: string;
  /** Human-readable label shown in the editor and on public pages. */
  label: string;
}

export interface AttributeGroup {
  /** Stable id used as the JSON sub-key for `single`/`multi` groups. */
  id: string;
  /** Group title rendered in the editor. */
  title: string;
  kind: AttributeGroupKind;
  options: AttributeOption[];
}

// ── Boolean groups (Yes/No per row) ────────────────────────────────────────
export const BOOLEAN_GROUPS: AttributeGroup[] = [
  {
    id: "accessibility",
    title: "Accessibility",
    kind: "boolean",
    options: [
      "Wheelchair Accessible",
      "ADA-compliant main entrance",
      "QR code menus available",
      "No steps or stairs",
      "ADA-compliant restroom",
      "ASL proficient",
      "Braille menus available",
      "Accessible parking near entrance",
      "Closed captioning on TVs",
    ].map((l) => ({ key: l, label: l })),
  },
  {
    id: "amenities",
    title: "Amenities",
    kind: "boolean",
    options: ["Drive-Thru", "Water Service", "Has ATM"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "diversity",
    title: "Diversity",
    kind: "boolean",
    options: [
      "LGBTQ-owned",
      "Black-owned",
      "Veteran-owned",
      "Woman-owned",
      "Latino-owned",
      "Asian-owned",
    ].map((l) => ({ key: l, label: l })),
  },
  {
    id: "eco_friendly",
    title: "Eco-friendly",
    kind: "boolean",
    options: [
      "Bike Parking",
      "Bring your own cup allowed",
      "Plastic-free packaging",
      "Compostable containers available",
      "Provides reusable tableware",
      "EV charging station available",
    ].map((l) => ({ key: l, label: l })),
  },
  {
    id: "family_amenities",
    title: "Family amenities",
    kind: "boolean",
    options: [
      "Child care available",
      "Changing tables",
      "Stroller parking",
      "High chairs",
      "Kids menu",
      "Play area",
      "Lactation room",
    ].map((l) => ({ key: l, label: l })),
  },
  {
    id: "food_ordering",
    title: "Food ordering",
    kind: "boolean",
    options: ["Offers Delivery", "Offers Takeout"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "miscellaneous",
    title: "Miscellaneous",
    kind: "boolean",
    options: ["Bottomless mimosas", "Happy Hour Specials"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "payments_boolean",
    title: "Payments",
    kind: "boolean",
    options: ["Accepts cash"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "reservations",
    title: "Reservations",
    kind: "boolean",
    options: ["Takes Reservations"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "seating",
    title: "Seating",
    kind: "boolean",
    options: [
      "Outdoor Seating",
      "Covered outdoor seating",
      "Heated outdoor seating",
      "Rooftop seating",
    ].map((l) => ({ key: l, label: l })),
  },
  {
    id: "services",
    title: "Services",
    kind: "boolean",
    options: ["Caters", "Private dining"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "other",
    title: "Other",
    kind: "boolean",
    options: [
      "Dogs Allowed",
      "Good for Happy Hour",
      "Has TV",
      "Reusable cup discount",
    ].map((l) => ({ key: l, label: l })),
  },
];

// ── Choice groups (single- or multi-select chips) ──────────────────────────
export const CHOICE_GROUPS: AttributeGroup[] = [
  {
    id: "accepted_cards",
    title: "Accepted Cards",
    kind: "multi",
    options: ["Credit", "Debit", "None"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "parking",
    title: "Parking",
    kind: "multi",
    options: ["Valet", "Garage", "Street", "Private Lot"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "alcohol",
    title: "Alcohol",
    kind: "single",
    options: ["Beer & Wine Only", "Full Bar", "No"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "wifi",
    title: "Wi-Fi",
    kind: "single",
    options: ["Free", "Paid", "No"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "large_party_gratuity",
    title: "Large parties gratuity",
    kind: "single",
    options: ["Gratuity included", "Tipping optional", "Tip"].map((l) => ({ key: l, label: l })),
  },
  {
    id: "tip",
    title: "Tip",
    kind: "single",
    options: ["We suggest gratuity", "Tipping optional"].map((l) => ({ key: l, label: l })),
  },
];

export const ALL_GROUPS: AttributeGroup[] = [...BOOLEAN_GROUPS, ...CHOICE_GROUPS];

export interface StructuredAttributes {
  boolean: Record<string, boolean>;
  single: Record<string, string>;
  multi: Record<string, string[]>;
}

export const emptyAttributes = (): StructuredAttributes => ({
  boolean: {},
  single: {},
  multi: {},
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Read structured attributes from a business row, falling back to the
 * legacy flat `amenities` array when the JSON document is empty.
 *
 * Legacy encoding rules in the flat array:
 *   - Plain string  → boolean true for that label.
 *   - "groupId::value" → choice group selection (multi appends, single overrides).
 */
export const parseAttributes = (input: {
  attributes?: unknown;
  amenities?: string[] | null;
}): StructuredAttributes => {
  const out = emptyAttributes();
  const raw = input.attributes;

  if (isObject(raw)) {
    const b = isObject(raw.boolean) ? raw.boolean : {};
    const s = isObject(raw.single) ? raw.single : {};
    const m = isObject(raw.multi) ? raw.multi : {};

    for (const [k, v] of Object.entries(b)) {
      if (typeof v === "boolean") out.boolean[k] = v;
    }
    for (const [k, v] of Object.entries(s)) {
      if (typeof v === "string" && v.length > 0) out.single[k] = v;
    }
    for (const [k, v] of Object.entries(m)) {
      if (Array.isArray(v)) {
        const cleaned = v.filter((x): x is string => typeof x === "string");
        if (cleaned.length > 0) out.multi[k] = cleaned;
      }
    }

    const hasAny =
      Object.keys(out.boolean).length +
        Object.keys(out.single).length +
        Object.keys(out.multi).length >
      0;
    if (hasAny) return out;
  }

  // Legacy fallback — parse flat `amenities` array.
  const choiceIds = new Set(CHOICE_GROUPS.map((g) => g.id));
  const choiceKind = new Map(CHOICE_GROUPS.map((g) => [g.id, g.kind]));

  for (const entry of input.amenities ?? []) {
    if (typeof entry !== "string") continue;
    const idx = entry.indexOf("::");
    if (idx === -1) {
      out.boolean[entry] = true;
      continue;
    }
    const groupId = entry.substring(0, idx);
    const value = entry.substring(idx + 2);
    if (!choiceIds.has(groupId)) continue;
    if (choiceKind.get(groupId) === "single") {
      out.single[groupId] = value;
    } else {
      const arr = out.multi[groupId] ?? [];
      if (!arr.includes(value)) arr.push(value);
      out.multi[groupId] = arr;
    }
  }
  return out;
};

/**
 * Build the legacy flat `amenities` array from structured attributes
 * for backward-compatible mirroring.
 */
export const toLegacyAmenities = (attrs: StructuredAttributes): string[] => {
  const list: string[] = [];
  for (const [k, v] of Object.entries(attrs.boolean)) {
    if (v) list.push(k);
  }
  for (const [k, v] of Object.entries(attrs.single)) {
    if (v) list.push(`${k}::${v}`);
  }
  for (const [k, vals] of Object.entries(attrs.multi)) {
    for (const v of vals) list.push(`${k}::${v}`);
  }
  return list.sort((a, b) => a.localeCompare(b));
};

/**
 * Strip values that are not part of the current schema. Keeps the JSON
 * document tidy and prevents typos from leaking into storage.
 */
export const sanitizeAttributes = (attrs: StructuredAttributes): StructuredAttributes => {
  const allowedBoolean = new Set(BOOLEAN_GROUPS.flatMap((g) => g.options.map((o) => o.key)));
  const allowedChoice = new Map(CHOICE_GROUPS.map((g) => [g.id, new Set(g.options.map((o) => o.key))]));
  const out = emptyAttributes();

  for (const [k, v] of Object.entries(attrs.boolean)) {
    if (allowedBoolean.has(k) && typeof v === "boolean") out.boolean[k] = v;
  }
  for (const [k, v] of Object.entries(attrs.single)) {
    const allowed = allowedChoice.get(k);
    if (allowed && allowed.has(v)) out.single[k] = v;
  }
  for (const [k, vals] of Object.entries(attrs.multi)) {
    const allowed = allowedChoice.get(k);
    if (!allowed) continue;
    const cleaned = vals.filter((v) => allowed.has(v));
    if (cleaned.length > 0) out.multi[k] = cleaned;
  }
  return out;
};

/**
 * Flat list of human-readable labels for public display.
 * Safe on empty / missing input.
 */
export const attributesToDisplayLabels = (input: {
  attributes?: unknown;
  amenities?: string[] | null;
}): string[] => {
  const attrs = parseAttributes(input);
  const labels: string[] = [];

  for (const group of BOOLEAN_GROUPS) {
    for (const opt of group.options) {
      if (attrs.boolean[opt.key]) labels.push(opt.label);
    }
  }
  for (const group of CHOICE_GROUPS) {
    if (group.kind === "single") {
      const v = attrs.single[group.id];
      if (v) labels.push(`${group.title}: ${v}`);
    } else {
      const vals = attrs.multi[group.id];
      if (vals && vals.length > 0) labels.push(`${group.title}: ${vals.join(", ")}`);
    }
  }
  return labels;
};

export const countSelected = (attrs: StructuredAttributes): number =>
  Object.values(attrs.boolean).filter(Boolean).length +
  Object.keys(attrs.single).length +
  Object.values(attrs.multi).reduce((acc, vals) => acc + vals.length, 0);
