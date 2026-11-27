import { describe, expect, it } from "vitest";
import { ownedAccountRedirect } from "./ownedAccountOrigin";

const alias = "https://qmaps.takatak.ca";

describe("ownedAccountRedirect", () => {
  it.each(["/compte", "/compte/fermeture", "/console"])("preserves the destination for %s", (pathname) => {
    const search = "?fiche=a9bf0001-0000-4000-8000-000000000001&retour=%2Fsearch";
    const hash = "#accueil";
    expect(ownedAccountRedirect(alias, { pathname, search, hash })).toBe(`https://qmaps.ca${pathname}${search}${hash}`);
  });

  it.each(["https://qmaps.ca", "https://www.qmaps.ca", "http://localhost:5173", `${alias}.example.com`])(
    "keeps the existing account route on %s",
    (origin) => {
      expect(ownedAccountRedirect(origin, { pathname: "/compte", search: "", hash: "" })).toBeNull();
    },
  );

  it("does not allow a path or query to replace the destination host", () => {
    const redirect = ownedAccountRedirect(alias, {
      pathname: "//example.com/compte",
      search: "?next=https://example.com",
      hash: "",
    });
    expect(new URL(redirect!).origin).toBe("https://qmaps.ca");
  });
});
