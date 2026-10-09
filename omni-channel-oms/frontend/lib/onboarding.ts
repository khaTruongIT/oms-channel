import type { BusinessType, CreateTenantInput } from "@/hooks/useTenants";

const defaultTenantPreferences = {
  timezone: "Asia/Ho_Chi_Minh",
  currency: "VND",
  locale: "vi-VN",
  dateFormat: "DD/MM/YYYY",
} as const;

export interface TenantOnboardingValues {
  shopName: string;
  businessName?: string;
  businessType?: BusinessType | "";
  contactEmail?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  dateFormat?: string;
}

function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function buildTenantOnboardingInput(
  values: TenantOnboardingValues,
): CreateTenantInput {
  const shopName = values.shopName.trim();
  const businessName = optionalValue(values.businessName);
  const contactEmail = optionalValue(values.contactEmail);

  return {
    shopName,
    ...(businessName ? { businessName } : {}),
    ...(contactEmail ? { contactEmail } : {}),
    ...(values.businessType ? { businessType: values.businessType } : {}),
    timezone: values.timezone ?? defaultTenantPreferences.timezone,
    currency: values.currency ?? defaultTenantPreferences.currency,
    locale: values.locale ?? defaultTenantPreferences.locale,
    dateFormat: values.dateFormat ?? defaultTenantPreferences.dateFormat,
  };
}
