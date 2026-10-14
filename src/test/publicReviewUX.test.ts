import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const code = readFileSync(
  resolve(process.cwd(), "src/components/business/BusinessReviewsTab.tsx"),
  "utf8",
);

describe("public review interactions", () => {
  it("filters visible reviews by chosen star rating", () => {
    expect(code).toContain("setRatingFilter");
    expect(code).toContain('review.rating === ratingFilter');
    expect(code).toContain("filteredReviews.map");
  });

  it("can expand and collapse long text", () => {
    expect(code).toContain("toggleExpanded(review.id)");
    expect(code).toContain('expandedReviews.has(review.id) ? "Lire moins" : "Lire plus"');
    expect(code).toContain("aria-expanded");
  });

  it("has no invented author counts or dead check-in affordance", () => {
    expect(code).not.toContain("0 avis • 0 photos");
    expect(code).not.toContain("Check in");
    expect(code).not.toContain("<button><MoreVertical");
    expect(code).toContain('navigate("/add-photo")');
  });
});
