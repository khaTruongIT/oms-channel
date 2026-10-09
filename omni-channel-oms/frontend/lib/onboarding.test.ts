import { describe, expect, it } from "vitest";
import type { BusinessType } from "@/hooks/useTenants";
import { buildTenantOnboardingInput } from "./onboarding";

describe("buildTenantOnboardingInput", () => {
  it("trims values and omits blank optional fields", () => {
    expect(
      buildTenantOnboardingInput({
        shopName: "  North Star Shop  ",
        businessName: "   ",
        contactEmail: " owner@example.com ",
        businessType: "retail" as BusinessType,
      }),
    ).toEqual({
      shopName: "North Star Shop",
      contactEmail: "owner@example.com",
      businessType: "retail",
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
      locale: "vi-VN",
      dateFormat: "DD/MM/YYYY",
    });
  });
});
