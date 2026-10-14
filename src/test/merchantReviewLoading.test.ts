import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("QMAPS merchant review loading integrity", () => {
  it("throws failed review/profile queries rather than displaying zero reviews", () => {
    const file = read("src/lib/reviewsWithAuthors.ts");
    expect(file).toContain("if (reviewsError) throw reviewsError");
    expect(file).toContain("if (profilesError) throw profilesError");
  });

  it("shows errors with retry, without infinite loading state", () => {
    const file = read("src/pages/MerchantDashboard.tsx");
    expect(file).toContain("setReviewsError(error instanceof Error");
    expect(file).toContain("setReviewsForBusinessId(selectedBiz.id)");
    expect(file).toContain("reviewsError && (");
    expect(file).toContain("setReloadReviews((v) => v + 1)");
  });

  it("never passes an old business' reviews to a new merchant overview", () => {
    const file = read("src/pages/MerchantDashboard.tsx");
    expect(file).toContain("reviews={reviewsForBusinessId === selectedBiz.id ? reviews : []}");
  });
});
