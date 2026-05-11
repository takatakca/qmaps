/**
 * Pure helpers for managing the businesses.photos text[] array.
 * The first element of the array is treated as the cover photo.
 */

export const isValidPhotoUrl = (url: unknown): url is string => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const dedupePhotoUrls = (urls: readonly (string | null | undefined)[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (typeof u !== "string") continue;
    const t = u.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
};

export const movePhotoToFront = (urls: readonly string[], target: string): string[] => {
  const idx = urls.indexOf(target);
  if (idx <= 0) return [...urls];
  const next = [...urls];
  const [item] = next.splice(idx, 1);
  next.unshift(item);
  return next;
};

export const reorderPhotos = (
  urls: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] => {
  const next = [...urls];
  if (fromIndex < 0 || fromIndex >= next.length) return next;
  const clamped = Math.max(0, Math.min(toIndex, next.length - 1));
  if (clamped === fromIndex) return next;
  const [item] = next.splice(fromIndex, 1);
  next.splice(clamped, 0, item);
  return next;
};

export const removePhotoUrl = (urls: readonly string[], target: string): string[] =>
  urls.filter((u) => u !== target);

export const addPhotoUrl = (
  urls: readonly string[],
  url: string,
): { ok: true; urls: string[] } | { ok: false; reason: "invalid" | "duplicate" } => {
  if (!isValidPhotoUrl(url)) return { ok: false, reason: "invalid" };
  const trimmed = url.trim();
  if (urls.includes(trimmed)) return { ok: false, reason: "duplicate" };
  return { ok: true, urls: [...urls, trimmed] };
};
