/**
 * Haptic Feedback Utility
 * Provides haptic feedback for user interactions
 */

import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const haptics = {
  /**
   * Light impact - for subtle interactions
   */
  light: () => {
    ReactNativeHapticFeedback.trigger("impactLight", options);
  },

  /**
   * Medium impact - for standard interactions
   */
  medium: () => {
    ReactNativeHapticFeedback.trigger("impactMedium", options);
  },

  /**
   * Heavy impact - for important actions
   */
  heavy: () => {
    ReactNativeHapticFeedback.trigger("impactHeavy", options);
  },

  /**
   * Success notification
   */
  success: () => {
    ReactNativeHapticFeedback.trigger("notificationSuccess", options);
  },

  /**
   * Warning notification
   */
  warning: () => {
    ReactNativeHapticFeedback.trigger("notificationWarning", options);
  },

  /**
   * Error notification
   */
  error: () => {
    ReactNativeHapticFeedback.trigger("notificationError", options);
  },

  /**
   * Selection change
   */
  selection: () => {
    ReactNativeHapticFeedback.trigger("selection", options);
  },
};
