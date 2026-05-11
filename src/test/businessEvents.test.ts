import { describe, expect, it } from "vitest";
import {
  ALLOWED_BUSINESS_EVENT_TYPES,
  buildBusinessEventPayload,
  isAllowedBusinessEventType,
  summarizeBusinessEvents,
} from "@/lib/businessEvents";

describe("businessEvents helpers", () => {
  it("isAllowedBusinessEventType filters known types", () => {
    expect(isAllowedBusinessEventType("profile_view")).toBe(true);
    expect(isAllowedBusinessEventType("menu_view")).toBe(true);
    expect(isAllowedBusinessEventType("nope")).toBe(false);
    expect(isAllowedBusinessEventType(null)).toBe(false);
  });

  it("buildBusinessEventPayload returns null on bad input", () => {
    expect(buildBusinessEventPayload({ businessId: "", eventType: "profile_view" })).toBeNull();
    expect(buildBusinessEventPayload({ businessId: "id", eventType: "nope" })).toBeNull();
  });

  it("buildBusinessEventPayload returns valid payload with defaults", () => {
    const p = buildBusinessEventPayload({ businessId: "b1", eventType: "phone_click" });
    expect(p).toEqual({
      business_id: "b1",
      user_id: null,
      event_type: "phone_click",
      metadata: {},
      source: null,
    });
  });

  it("buildBusinessEventPayload preserves provided metadata", () => {
    const p = buildBusinessEventPayload({
      businessId: "b1",
      userId: "u1",
      eventType: "menu_view",
      metadata: { a: 1 },
      source: "detail",
    });
    expect(p?.metadata).toEqual({ a: 1 });
    expect(p?.source).toBe("detail");
    expect(p?.user_id).toBe("u1");
  });

  it("summarizeBusinessEvents groups counts by type", () => {
    expect(summarizeBusinessEvents([])).toEqual({});
    expect(
      summarizeBusinessEvents([
        { event_type: "menu_view" },
        { event_type: "menu_view" },
        { event_type: "phone_click" },
      ]),
    ).toEqual({ menu_view: 2, phone_click: 1 });
  });

  it("includes search_click and menu_view in allowed list", () => {
    expect(ALLOWED_BUSINESS_EVENT_TYPES).toContain("search_click");
    expect(ALLOWED_BUSINESS_EVENT_TYPES).toContain("menu_view");
  });
});
