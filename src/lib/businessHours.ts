/**
 * Phase 15C — structured weekly hours for QMAPS businesses.
 *
 * Pure helpers, no React/Supabase. The structured `hours_json` column lives
 * alongside the legacy free-text `hours` column for backward compatibility:
 *
 * {
 *   "monday": { "closed": false, "blocks": [{ "open": "09:00", "close": "17:00" }] },
 *   ...
 *   "sunday": { "closed": true, "blocks": [] }
 * }
 */

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof DAYS)[number];

export const DAY_LABELS_FR: Record<DayKey, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export interface HoursBlock {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface DayHours {
  closed: boolean;
  blocks: HoursBlock[];
  note?: string | null;
}

export type WeeklyHours = Record<DayKey, DayHours>;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidTime = (s: string) => typeof s === "string" && HHMM.test(s);

/** Convert "HH:MM" → minutes since midnight. Returns NaN for invalid. */
export const timeToMinutes = (s: string): number => {
  if (!isValidTime(s)) return NaN;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

/** True iff close > open (split shifts allowed but no overnight in v1). */
export const isValidBlock = (b: HoursBlock): boolean => {
  const o = timeToMinutes(b.open);
  const c = timeToMinutes(b.close);
  return Number.isFinite(o) && Number.isFinite(c) && c > o;
};

export const emptyWeeklyHours = (): WeeklyHours =>
  DAYS.reduce((acc, d) => {
    acc[d] = { closed: true, blocks: [] };
    return acc;
  }, {} as WeeklyHours);

export const defaultWeeklyHours = (): WeeklyHours =>
  DAYS.reduce((acc, d) => {
    acc[d] = {
      closed: d === "sunday",
      blocks: d === "sunday" ? [] : [{ open: "09:00", close: "17:00" }],
    };
    return acc;
  }, {} as WeeklyHours);

/**
 * Best-effort parse of an unknown JSON shape into WeeklyHours.
 * Returns null if the input is not a recognisable structure.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const readBlock = (value: unknown): HoursBlock | null => {
  if (!isRecord(value) || typeof value.open !== "string" || typeof value.close !== "string") return null;
  const block = { open: value.open, close: value.close };
  return isValidTime(block.open) && isValidTime(block.close) ? block : null;
};

export const parseWeeklyHours = (raw: unknown): WeeklyHours | null => {
  if (!isRecord(raw)) return null;
  // Must look like at least one day key.
  const hasAnyDay = DAYS.some((day) => day in raw);
  if (!hasAnyDay) return null;
  const out = emptyWeeklyHours();
  for (const day of DAYS) {
    const value = raw[day];
    if (!isRecord(value)) continue;
    const closed = !!value.closed;
    const blocks = Array.isArray(value.blocks)
      ? value.blocks.flatMap((block) => {
          const parsed = readBlock(block);
          return parsed ? [parsed] : [];
        })
      : [];
    out[day] = {
      closed: closed || blocks.length === 0,
      blocks: closed ? [] : blocks,
      note: typeof value.note === "string" ? value.note : null,
    };
  }
  return out;
};

const JS_DAY_TO_KEY: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const dayKeyForDate = (d: Date): DayKey => JS_DAY_TO_KEY[d.getDay()];

/** True iff the given date falls inside any block of that day. */
export const isOpenAt = (week: WeeklyHours, date: Date): boolean => {
  const day = week[dayKeyForDate(date)];
  if (!day || day.closed || day.blocks.length === 0) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return day.blocks.some((b) => {
    const o = timeToMinutes(b.open);
    const c = timeToMinutes(b.close);
    return Number.isFinite(o) && Number.isFinite(c) && minutes >= o && minutes < c;
  });
};

/** Render a single day's hours in French ("Fermé" or "09:00 – 17:00, 18:00 – 22:00"). */
export const formatDayHours = (day: DayHours): string => {
  if (!day || day.closed || day.blocks.length === 0) return "Fermé";
  return day.blocks.map((b) => `${b.open} – ${b.close}`).join(", ");
};

/** Compact summary of the legacy text hours field, untouched by structured helpers. */
export const summarizeWeeklyHours = (week: WeeklyHours | null | undefined): string => {
  if (!week) return "";
  return DAYS.map((d) => `${DAY_LABELS_FR[d]}: ${formatDayHours(week[d])}`).join(" · ");
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Special hours — Phase 15D. Date-keyed overrides for holidays/events.     */
/* ──────────────────────────────────────────────────────────────────────── */

/** Map of "YYYY-MM-DD" → DayHours (with optional note). */
export type SpecialHours = Record<string, DayHours>;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const parseSpecialHours = (raw: unknown): SpecialHours | null => {
  if (!isRecord(raw)) return null;
  const out: SpecialHours = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!DATE_KEY.test(key) || !isRecord(value)) continue;
    const closed = !!value.closed;
    const blocks = Array.isArray(value.blocks)
      ? value.blocks.flatMap((block) => {
          const parsed = readBlock(block);
          return parsed && isValidBlock(parsed) ? [parsed] : [];
        })
      : [];
    out[key] = {
      closed: closed || blocks.length === 0,
      blocks: closed ? [] : blocks,
      note: typeof value.note === "string" ? value.note : null,
    };
  }
  return Object.keys(out).length === 0 ? null : out;
};

/** Returns the effective DayHours for the given date, preferring special_hours. */
export const getHoursForDate = (
  week: WeeklyHours | null,
  special: SpecialHours | null,
  date: Date,
): { day: DayHours | null; isSpecial: boolean } => {
  const key = formatDateKey(date);
  if (special && special[key]) return { day: special[key], isSpecial: true };
  if (week) return { day: week[dayKeyForDate(date)] ?? null, isSpecial: false };
  return { day: null, isSpecial: false };
};

export const isOpenAtWithSpecialHours = (
  week: WeeklyHours | null,
  special: SpecialHours | null,
  date: Date,
): boolean => {
  const { day } = getHoursForDate(week, special, date);
  if (!day || day.closed || day.blocks.length === 0) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return day.blocks.some((b) => {
    const o = timeToMinutes(b.open);
    const c = timeToMinutes(b.close);
    return Number.isFinite(o) && Number.isFinite(c) && minutes >= o && minutes < c;
  });
};

export const formatSpecialHoursForDate = (special: SpecialHours | null, date: Date): string => {
  if (!special) return "";
  const day = special[formatDateKey(date)];
  if (!day) return "";
  return formatDayHours(day);
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Review rating distribution — used by Business Detail page.              */
/* ──────────────────────────────────────────────────────────────────────── */

export interface RatingDistribution {
  total: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const getReviewRatingDistribution = (
  reviews: Array<{ rating?: number | null } | null | undefined>,
): RatingDistribution => {
  const counts: RatingDistribution["counts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) {
    const rating = r?.rating;
    if (typeof rating !== "number") continue;
    const rounded = Math.round(rating);
    if (rounded >= 1 && rounded <= 5) {
      counts[rounded as 1 | 2 | 3 | 4 | 5] += 1;
      total += 1;
    }
  }
  const percentages: RatingDistribution["percentages"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (total > 0) {
    ([1, 2, 3, 4, 5] as const).forEach((k) => {
      percentages[k] = Math.round((counts[k] / total) * 1000) / 10;
    });
  }
  return { total, counts, percentages };
};
