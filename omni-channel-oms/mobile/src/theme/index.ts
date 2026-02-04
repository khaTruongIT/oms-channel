/**
 * Theme - OMS Mobile
 * Unified theme export
 */

import { colors } from "./colors";
import { typography, textStyles } from "./typography";
import { spacing, borderRadius, shadows } from "./spacing";

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,

  // Animation durations (following UX guidelines: 150-300ms)
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
  },

  // Touch target minimum size (44x44px per UX guidelines)
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },

  // Common dimensions
  dimensions: {
    headerHeight: 60,
    tabBarHeight: 60,
    buttonHeight: 48,
    inputHeight: 48,
    cardPadding: spacing.md,
    screenPadding: spacing.md,
  },
};

export type Theme = typeof theme;

// Export individual modules
export { colors } from "./colors";
export { typography, textStyles } from "./typography";
export { spacing, borderRadius, shadows } from "./spacing";
