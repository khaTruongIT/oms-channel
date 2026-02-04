/**
 * LoadingSpinner Component
 * Full-screen loading overlay
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { theme } from "@theme";

interface LoadingSpinnerProps {
  visible?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible = true,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backdrop}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  backdrop: {
    backgroundColor: theme.colors.backgroundLight,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
  },
});
