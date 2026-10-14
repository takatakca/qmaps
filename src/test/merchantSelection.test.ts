import { describe, expect, it } from "vitest";
import { chooseMerchantBusiness } from "@/lib/merchantSelection";

describe("merchant business switching", () => {
  const businesses = [
    { id: "owned-a", name: "Boutique A" },
    { id: "owned-b", name: "Boutique B" },
  ];

  it("keeps the selected business across a refresh", () => {
    expect(chooseMerchantBusiness(businesses, "owned-b")?.name).toBe("Boutique B");
  });

  it("falls back only to a currently owned business", () => {
    expect(chooseMerchantBusiness(businesses, "other-tenant")?.id).toBe("owned-a");
    expect(chooseMerchantBusiness(businesses, null)?.id).toBe("owned-a");
  });

  it("clears selection when the user's owned list becomes empty", () => {
    expect(chooseMerchantBusiness([], "owned-b")).toBeNull();
  });
});
