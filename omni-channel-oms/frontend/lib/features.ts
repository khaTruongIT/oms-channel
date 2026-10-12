export interface FeatureFlags {
  customers: boolean;
  notifications: boolean;
  reports: boolean;
  bulkOperations: boolean;
  channelSync: boolean;
}

export const FEATURES: FeatureFlags = {
  customers: process.env.NEXT_PUBLIC_FEATURE_CUSTOMERS !== "false",
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS !== "false",
  reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS !== "false",
  bulkOperations: process.env.NEXT_PUBLIC_FEATURE_BULK_OPS !== "false",
  channelSync: process.env.NEXT_PUBLIC_FEATURE_CHANNEL_SYNC !== "false",
};

export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  return Boolean(FEATURES[featureName]);
}
