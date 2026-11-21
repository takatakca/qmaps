import type { Tables } from "@/integrations/supabase/types";

export type BusinessContent = Tables<"business_content">;
export type ContentKind = BusinessContent["kind"];

export function publicContentUrl(value: string | null): string | null {
  if (
    !value ||
    value.length > 2048 ||
    !/^https:\/\/[^/]/i.test(value) ||
    /[\s\\]/.test(value)
  )
    return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
