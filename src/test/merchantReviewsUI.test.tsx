import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const source = readFileSync(resolve(root, "src/components/merchant/MerchantReviews.tsx"), "utf8");

describe("merchant review UI contract without a missing DOM-test peer", () => {
  it("displays a truthful empty state and links to the real business editor", () => {
    expect(source).toContain("Aucun avis disponible pour le moment");
    expect(source).toContain('to="/merchant/business-info"');
    expect(source).toContain("reviews.length === 0");
    expect(source).not.toContain("notRecommendedCount = 0");
    expect(source).not.toContain("logiciel de recommandation automatisé");
  });

  it("submits merchant replies only through the authenticated Edge Function", () => {
    expect(source).toContain('functions.invoke("merchant-reply-review"');
    expect(source).toContain('body: { reviewId, body }');
    expect(source).toContain("onReplySaved?.()");
    expect(source).not.toContain('.from("reviews").update(');
  });

  it("does not invent a review body when a customer provides a rating only", () => {
    expect(source).toContain("Note attribuée sans commentaire.");
    expect(source).toContain("reviews.map((review)");
  });
});
