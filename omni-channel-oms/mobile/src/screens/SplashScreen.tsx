/**
 * Splash Screen
 * Initial loading screen with auth check
 */

import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAppDispatch } from "@store/hooks";
import { loadStoredAuth } from "@store/slices/authSlice";
import { theme } from "@theme";

export const SplashScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Load stored authentication data
    dispatch(loadStoredAuth());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OMS Mobile</Text>
      <Text style={styles.subtitle}>Order Management System</Text>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.textStyles.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing["2xl"],
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
});
