/**
 * Color Palette - OMS Mobile
 * Based on Flat Design style with Purple/Orange theme
 */

export const colors = {
  // Primary Colors
  primary: "#7C3AED", // Purple
  primaryLight: "#A78BFA",
  primaryDark: "#6D28D9",

  // Secondary/CTA
  secondary: "#A78BFA",
  cta: "#F97316", // Orange
  ctaLight: "#FB923C",
  ctaDark: "#EA580C",

  // Background
  background: "#FAF5FF",
  backgroundLight: "#FFFFFF",
  backgroundDark: "#F3E8FF",

  // Text
  text: "#4C1D95",
  textLight: "#6B21A8",
  textMuted: "#9333EA",
  textInverse: "#FFFFFF",

  // Semantic Colors
  success: "#10B981",
  successLight: "#34D399",
  error: "#EF4444",
  errorLight: "#F87171",
  warning: "#F59E0B",
  warningLight: "#FBBF24",
  info: "#3B82F6",
  infoLight: "#60A5FA",

  // Neutral Colors
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Border
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderDark: "#CBD5E1",

  // Shadow
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.2)",

  // Status Colors (for orders)
  statusPending: "#F59E0B",
  statusProcessing: "#3B82F6",
  statusShipped: "#8B5CF6",
  statusDelivered: "#10B981",
  statusCancelled: "#EF4444",

  // Channel Colors
  channelShopee: "#EE4D2D",
  channelTiktok: "#000000",
  channelLazada: "#0F146D",
};

export type ColorKey = keyof typeof colors;
