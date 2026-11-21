import { describe, expect, it } from "vitest";
import { businessWebsite } from "@/lib/businessWebsite";

describe("website addresses on business listings", () => {
  it("keeps legacy HTTP URLs, HTTPS links and bare domains with paths", () => {
    expect(businessWebsite("http://example.org/menu")).toBe("http://example.org/menu");
    expect(businessWebsite(" café.example/menu?q=1#dîner ")).toBe("https://xn--caf-dma.example/menu?q=1#d%C3%AEner");
    expect(businessWebsite("example.org:8443")).toBe("https://example.org:8443/");
  });

  it.each([null, "", "/public", "//example.org", "ftp://example.org", "mailto:info@example.org", "https:///example.org", "https://name@example.org", "https://example.org/a b"])(
    "omits unsuitable stored websites and rejects them on save: %s", value => {
      expect(businessWebsite(value)).toBeNull();
    },
  );
});
