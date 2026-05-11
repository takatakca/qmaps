import { describe, it, expect } from "vitest";
import {
  shouldLazyLoadImage,
  getImageLoadingStrategy,
  getImageFetchPriority,
} from "@/lib/performance";

describe("performance image helpers", () => {
  it("first image is eager / high priority", () => {
    expect(shouldLazyLoadImage(0)).toBe(false);
    expect(getImageLoadingStrategy(0)).toBe("eager");
    expect(getImageFetchPriority(0)).toBe("high");
  });

  it("later images lazy / auto priority", () => {
    expect(shouldLazyLoadImage(3)).toBe(true);
    expect(getImageLoadingStrategy(3)).toBe("lazy");
    expect(getImageFetchPriority(3)).toBe("auto");
  });

  it("respects custom eagerCount", () => {
    expect(getImageLoadingStrategy(2, 4)).toBe("eager");
    expect(getImageFetchPriority(5, 4)).toBe("auto");
  });
});
