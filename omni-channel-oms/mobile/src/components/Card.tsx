/**
 * Card Component
 * Container with shadow and optional press interaction
 */

import React from "react";
import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { theme } from "@theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  pressable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  pressable = false,
}) => {
  if (pressable || onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  pressed: {
    opacity: 0.8,
    ...theme.shadows.sm,
  },
});
