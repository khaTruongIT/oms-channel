/**
 * Root Navigator
 * Main navigation container with conditional rendering
 */

import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { loadStoredAuth } from "@store/slices/authSlice";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { SplashScreen } from "@screens/SplashScreen";
import { navigationRef } from "@services/navigation.service";

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Load stored authentication on app start
    dispatch(loadStoredAuth());
  }, [dispatch]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
