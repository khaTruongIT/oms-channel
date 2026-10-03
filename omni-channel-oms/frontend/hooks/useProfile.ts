"use client";

import useSWR from "swr";
import { UserProfile, authService } from "@/lib/auth";

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    "/auth/profile",
    () => authService.getProfile(),
  );

  return {
    profile: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function updateProfile(data: Partial<UserProfile>) {
  return authService.updateProfile(data);
}
