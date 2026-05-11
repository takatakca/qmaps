/**
 * Pure helpers for tracking and summarizing business analytics events.
 */

export const ALLOWED_BUSINESS_EVENT_TYPES = [
  "profile_view",
  "phone_click",
  "website_click",
  "directions_click",
  "message_click",
  "save_click",
  "search_click",
  "menu_view",
  "photo_view",
  "project_start",
  "quote_sent",
] as const;

export type AllowedBusinessEventType = (typeof ALLOWED_BUSINESS_EVENT_TYPES)[number];

export const isAllowedBusinessEventType = (t: unknown): t is AllowedBusinessEventType => {
  return typeof t === "string" && (ALLOWED_BUSINESS_EVENT_TYPES as readonly string[]).includes(t);
};

export interface BuildBusinessEventInput {
  businessId: string;
  userId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown> | null;
  source?: string | null;
}

export interface BusinessEventPayload {
  business_id: string;
  user_id: string | null;
  event_type: AllowedBusinessEventType;
  metadata: Record<string, unknown>;
  source: string | null;
}

export const buildBusinessEventPayload = (
  input: BuildBusinessEventInput,
): BusinessEventPayload | null => {
  if (!input.businessId) return null;
  if (!isAllowedBusinessEventType(input.eventType)) return null;
  return {
    business_id: input.businessId,
    user_id: input.userId ?? null,
    event_type: input.eventType,
    metadata: input.metadata ?? {},
    source: input.source ?? null,
  };
};

export const summarizeBusinessEvents = (
  events: readonly { event_type?: string }[],
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const e of events) {
    if (!e || typeof e.event_type !== "string") continue;
    out[e.event_type] = (out[e.event_type] ?? 0) + 1;
  }
  return out;
};
