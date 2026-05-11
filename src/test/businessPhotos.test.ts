import { describe, expect, it } from "vitest";
import {
  addPhotoUrl,
  dedupePhotoUrls,
  isValidPhotoUrl,
  movePhotoToFront,
  removePhotoUrl,
  reorderPhotos,
} from "@/lib/businessPhotos";

describe("businessPhotos helpers", () => {
  it("isValidPhotoUrl validates http(s) URLs", () => {
    expect(isValidPhotoUrl("https://example.com/a.jpg")).toBe(true);
    expect(isValidPhotoUrl("http://example.com/a.jpg")).toBe(true);
    expect(isValidPhotoUrl("ftp://example.com/a.jpg")).toBe(false);
    expect(isValidPhotoUrl("not a url")).toBe(false);
    expect(isValidPhotoUrl("")).toBe(false);
    expect(isValidPhotoUrl(null)).toBe(false);
  });

  it("dedupePhotoUrls removes duplicates and trims", () => {
    expect(dedupePhotoUrls(["a", " a ", "b", null, undefined, "b"])).toEqual(["a", "b"]);
  });

  it("movePhotoToFront moves target to index 0", () => {
    expect(movePhotoToFront(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
    expect(movePhotoToFront(["a", "b", "c"], "a")).toEqual(["a", "b", "c"]);
    expect(movePhotoToFront(["a", "b"], "missing")).toEqual(["a", "b"]);
  });

  it("reorderPhotos moves item between indices", () => {
    expect(reorderPhotos(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorderPhotos(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderPhotos(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });

  it("removePhotoUrl removes target", () => {
    expect(removePhotoUrl(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("addPhotoUrl validates and prevents duplicates", () => {
    expect(addPhotoUrl([], "nope")).toEqual({ ok: false, reason: "invalid" });
    expect(addPhotoUrl(["https://x/a.jpg"], "https://x/a.jpg")).toEqual({ ok: false, reason: "duplicate" });
    const r = addPhotoUrl(["https://x/a.jpg"], "https://x/b.jpg");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.urls).toEqual(["https://x/a.jpg", "https://x/b.jpg"]);
  });
});
