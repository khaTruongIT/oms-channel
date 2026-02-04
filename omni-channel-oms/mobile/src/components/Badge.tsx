/**
 * Badge Component
 * Status indicator for orders and other entities
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "@theme";
import { OrderStatus } from "@types";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "error" | "info" | "default";
  status?: OrderStatus;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant,
  status,
  style,
}) => {
  // Determine variant from order status if provided
  let badgeVariant = variant || "default";

  if (status) {
    switch (status) {
      case OrderStatus.DELIVERED:
        badgeVariant = "success";
        break;
      case OrderStatus.PENDING:
        badgeVariant = "warning";
        break;
      case OrderStatus.CANCELLED:
        badgeVariant = "error";
        break;
      case OrderStatus.PROCESSING:
      case OrderStatus.SHIPPED:
        badgeVariant = "info";
        break;
    }
  }

  return (
    <View style={[styles.badge, styles[badgeVariant], style]}>
      <Text style={[styles.text, styles[`${badgeVariant}Text`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
  },
  text: {
    ...theme.textStyles.caption,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  // Variants
  success: {
    backgroundColor: theme.colors.successLight,
  },
  successText: {
    color: theme.colors.success,
  },
  warning: {
    backgroundColor: theme.colors.warningLight,
  },
  warningText: {
    color: theme.colors.warning,
  },
  error: {
    backgroundColor: theme.colors.errorLight,
  },
  errorText: {
    color: theme.colors.error,
  },
  info: {
    backgroundColor: theme.colors.infoLight,
  },
  infoText: {
    color: theme.colors.info,
  },
  default: {
    backgroundColor: theme.colors.gray200,
  },
  defaultText: {
    color: theme.colors.gray700,
  },
});
