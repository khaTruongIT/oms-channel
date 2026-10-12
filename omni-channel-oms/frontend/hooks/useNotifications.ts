/**
 * useNotifications Hook - Sprint 4.2
 * 30s tenant-scoped polling, optimistic updates, and mark as read handlers
 */

"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import { isFeatureEnabled } from "@/lib/features";

export interface NotificationItem {
  id: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  body: string;
  message?: string;
  link?: string | null;
  dedupe_key?: string | null;
  read_at?: string | null;
  read: boolean;
  user_id?: string | null;
  created_at: string;
  createdAt: string;
  updated_at: string;
}

export type Notification = NotificationItem;

export interface NotificationsResponse {
  items: Array<Omit<NotificationItem, "read" | "createdAt"> & { read_at?: string | null; created_at: string }>;
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const defaultResponse: NotificationsResponse = {
  items: [],
  total: 0,
  unreadCount: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const fetcher = (url: string) => api.get<NotificationsResponse>(url).then((res) => res.data);

export async function markNotificationAsRead(id: string): Promise<any> {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsAsRead(): Promise<{ updatedCount: number }> {
  const { data } = await api.post<{ updatedCount: number }>("/notifications/read-all");
  return data;
}

export function useNotifications() {
  const isEnabled = isFeatureEnabled("notifications");

  const { data, error, isLoading, mutate } = useTenantScopedSWR<NotificationsResponse>(
    isEnabled ? "/notifications" : null,
    fetcher,
    {
      refreshInterval: 30000, // 30s polling when tab is active
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  const notificationsData = data || defaultResponse;

  const notifications: NotificationItem[] = (notificationsData.items || []).map((n) => ({
    ...n,
    severity: (n.severity as any) || "INFO",
    message: n.body || "",
    read: Boolean(n.read_at),
    createdAt: n.created_at,
  }));

  const markAsRead = async (id: string) => {
    // Optimistic update
    await mutate(
      (current) => {
        if (!current) return current;
        const updatedItems = current.items.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
        );
        return {
          ...current,
          items: updatedItems,
          unreadCount: Math.max(0, current.unreadCount - 1),
        };
      },
      false,
    );

    try {
      await markNotificationAsRead(id);
      mutate();
    } catch (err) {
      mutate();
      throw err;
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    await mutate(
      (current) => {
        if (!current) return current;
        const now = new Date().toISOString();
        const updatedItems = current.items.map((item) => ({ ...item, read_at: now }));
        return {
          ...current,
          items: updatedItems,
          unreadCount: 0,
        };
      },
      false,
    );

    try {
      await markAllNotificationsAsRead();
      mutate();
    } catch (err) {
      mutate();
      throw err;
    }
  };

  return {
    notifications,
    unreadCount: notificationsData.unreadCount,
    total: notificationsData.total,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    markAsRead,
    markAllAsRead,
    mutate,
  };
}
