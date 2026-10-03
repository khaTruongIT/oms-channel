/**
 * useNotifications Hook
 * Notification management with real-time updates
 */

"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";

export interface Notification {
  id: string;
  type: "order" | "inventory" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    },
  );

  const unreadCount = data?.filter((n) => !n.read).length || 0;

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      mutate();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PUT",
      });
      mutate();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return {
    notifications: data || [],
    unreadCount,
    isLoading,
    isError: error,
    markAsRead,
    markAllAsRead,
    mutate,
  };
}
