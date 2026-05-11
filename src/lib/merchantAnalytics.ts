import type { AnalyticsTotals } from "@/hooks/useMerchantAnalytics";

export interface BusinessEventLike {
  event_type: string;
  created_at?: string;
}

export interface ReviewLike {
  rating?: number | null;
}

export const summarizeBusinessEvents = (
  events: readonly BusinessEventLike[],
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const e of events) {
    if (!e || typeof e.event_type !== "string") continue;
    out[e.event_type] = (out[e.event_type] ?? 0) + 1;
  }
  return out;
};

export const getAnalyticsDateRange = (days: number): { from: Date; to: Date } => {
  const safeDays = Math.max(1, Math.floor(days));
  const to = new Date();
  const from = new Date(to.getTime() - safeDays * 24 * 60 * 60 * 1000);
  return { from, to };
};

export const calculateAverageRating = (reviews: readonly ReviewLike[]): number => {
  const valid = reviews
    .map((r) => Number(r?.rating))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!valid.length) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 10) / 10;
};

export const formatAnalyticsCount = (count: number): string => {
  if (!Number.isFinite(count) || count < 0) return "0";
  if (count >= 10000) return `${(count / 1000).toFixed(0)}k`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(Math.floor(count));
};

export const totalsFromEvents = (events: readonly BusinessEventLike[]): Partial<AnalyticsTotals> => {
  return summarizeBusinessEvents(events) as Partial<AnalyticsTotals>;
};
