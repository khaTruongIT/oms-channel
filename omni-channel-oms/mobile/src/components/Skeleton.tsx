/**
 * Skeleton Loader Component
 * Provides loading placeholders for content
 */

import React from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { theme } from "@theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton Card for Dashboard Stats
export const SkeletonStatCard: React.FC = () => (
  <View style={styles.statCard}>
    <Skeleton width={60} height={40} style={styles.statValue} />
    <Skeleton width={80} height={16} style={styles.statLabel} />
  </View>
);

// Skeleton Order Card
export const SkeletonOrderCard: React.FC = () => (
  <View style={styles.orderCard}>
    <View style={styles.orderHeader}>
      <Skeleton width={120} height={20} />
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
    <Skeleton width="60%" height={16} style={{ marginTop: theme.spacing.xs }} />
    <View style={styles.orderFooter}>
      <Skeleton width={80} height={20} />
      <Skeleton width={100} height={14} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.border,
  },
  statCard: {
    width: "48%",
    margin: theme.spacing.xs,
    alignItems: "center",
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
  },
  statValue: {
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    marginTop: theme.spacing.xs,
  },
  orderCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
