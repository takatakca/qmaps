import { describe, expect, it } from "vitest";
import { filterSupportFaqs, supportFaqs } from "@/lib/supportFaq";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("real searchable QMAPS support", () => {
  it("returns every FAQ when no search was submitted", () => {
    expect(filterSupportFaqs("")).toHaveLength(supportFaqs.length);
  });
  it("matches text without accent or case sensitivity", () => {
    expect(filterSupportFaqs("FACTURATION").map((faq) => faq.id)).toContain("billing");
    expect(filterSupportFaqs("donnees").map((faq) => faq.id)).toContain("privacy");
    expect(filterSupportFaqs("aucun terme valide")).toHaveLength(0);
  });
  it("links every answer to an actual QMAPS route", () => {
    const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
    for (const faq of supportFaqs) {
      const path = faq.link.split("?")[0];
      expect(app, path).toContain(`path="${path}"`);
    }
  });
  it("has real FAQ disclosures, not inert question or search buttons", () => {
    const page = readFileSync(resolve(process.cwd(), "src/pages/Support.tsx"), "utf8");
    expect(page).toContain("<details");
    expect(page).toContain("<summary");
    expect(page).toContain("filterSupportFaqs(query)");
    expect(page).toContain('to="/support-policy"');
  });
});
