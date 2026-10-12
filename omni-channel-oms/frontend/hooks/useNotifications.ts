/**
 * @deprecated Gated until Sprint 4 (30s polling over /notifications).
 * useNotifications Hook
 */

"use client";

import useSWR from "swr";
import { isFeatureEnabled } from "@/lib/features";

export interface Notification {
  id: string;
  type: "order" | "inventory" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const emptyNotifications: Notification[] = [];

/**
 * @deprecated Gated by NEXT_PUBLIC_FEATURE_NOTIFICATIONS until Sprint 4
 */
export function useNotifications() {
  const isEnabled = isFeatureEnabled("notifications");
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    isEnabled ? "/api/notifications" : null,
    {
      refreshInterval: 30000,
    },
  );

  const notifications = isEnabled ? (data || emptyNotifications) : emptyNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (_id: string) => {};
  const markAllAsRead = async () => {};

  return {
    notifications,
    unreadCount,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}
