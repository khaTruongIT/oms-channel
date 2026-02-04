/**
 * Typography - OMS Mobile
 * Using Plus Jakarta Sans font family
 */

export const typography = {
  // Font Families
  fontFamily: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semiBold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    light: "PlusJakartaSans-Light",
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  // Font Weights
  fontWeight: {
    light: "300" as const,
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// Text Style Presets
export const textStyles = {
  h1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize["4xl"],
    lineHeight: typography.fontSize["4xl"] * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.bold,
  },
  h2: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize["3xl"],
    lineHeight: typography.fontSize["3xl"] * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.bold,
  },
  h3: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize["2xl"],
    lineHeight: typography.fontSize["2xl"] * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.semiBold,
  },
  h4: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semiBold,
  },
  h5: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semiBold,
  },
  h6: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.semiBold,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
  },
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
  },
  button: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.semiBold,
  },
  buttonSmall: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
    fontWeight: typography.fontWeight.semiBold,
  },
};

export type TextStyleKey = keyof typeof textStyles;
