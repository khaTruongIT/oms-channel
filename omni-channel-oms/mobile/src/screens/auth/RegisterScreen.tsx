/**
 * Register Screen
 * User registration screen
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { register, clearError } from "@store/slices/authSlice";
import { Button, Input } from "@components";
import { theme } from "@theme";

export const RegisterScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate name
    if (!name) {
      setNameError("Name is required");
      isValid = false;
    }

    // Validate email
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid");
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(register({ name, email, password })).unwrap();
      // Navigation will be handled by RootNavigator based on auth state
    } catch (err) {
      Alert.alert("Registration Failed", error || "An error occurred");
    }
  };

  const handleBackToLogin = () => {
    dispatch(clearError());
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            error={nameError}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            autoCapitalize="none"
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Register"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Button
              title="Login"
              onPress={handleBackToLogin}
              variant="outline"
              size="small"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing["2xl"],
    alignItems: "center",
  },
  title: {
    ...theme.textStyles.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
  },
  form: {
    width: "100%",
  },
  registerButton: {
    marginTop: theme.spacing.md,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  loginText: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
  },
});
