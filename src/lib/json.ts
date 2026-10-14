import type { Json } from "@/integrations/supabase/types";

/** Converts a plain value into the JSON shape Supabase accepts. */
export function toJson(value: unknown): Json {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => toJson(item));
  if (typeof value === "object") {
    const out: { [key: string]: Json } = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      out[key] = toJson(item);
    }
    return out;
  }
  return null;
}
