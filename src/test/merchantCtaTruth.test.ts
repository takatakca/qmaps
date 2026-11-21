import { describe, expect, it } from "vitest";
import { publicContentUrl } from "@/lib/businessContent";

describe("merchant action and publication links", () => {
  it("preserves a merchant’s destination and query", () => {
    expect(publicContentUrl("https://example.ca/menu?jour=lundi")).toBe(
      "https://example.ca/menu?jour=lundi",
    );
  });
  it.each([
    null,
    "",
    "/menu",
    "http://example.ca",
    "javascript:void(0)",
    "https://user@site.ca",
    "https:///site.ca",
    "https://site.ca/with space",
  ])("omits an invalid public destination %s", (value) => {
    expect(publicContentUrl(value)).toBeNull();
  });
});
