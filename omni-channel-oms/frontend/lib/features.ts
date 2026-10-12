export interface FeatureFlags {
  customers: boolean;
  notifications: boolean;
  reports: boolean;
  bulkOperations: boolean;
  channelSync: boolean;
}

export const FEATURES: FeatureFlags = {
  customers: process.env.NEXT_PUBLIC_FEATURE_CUSTOMERS === "true",
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS === "true",
  reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS === "true",
  bulkOperations: process.env.NEXT_PUBLIC_FEATURE_BULK_OPS === "true",
  channelSync: process.env.NEXT_PUBLIC_FEATURE_CHANNEL_SYNC !== "false",
};

export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  return Boolean(FEATURES[featureName]);
}
