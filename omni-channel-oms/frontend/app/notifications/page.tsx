/**
 * Notifications Center Page
 * Real-time notifications with filtering and actions
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { TableSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import {
  Bell,
  CheckCheck,
  Package,
  ShoppingCart,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case "inventory":
        return <Package className="w-5 h-5 text-orange-600" />;
      case "system":
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return "bg-blue-100";
      case "inventory":
        return "bg-orange-100";
      case "system":
        return "bg-gray-100";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Notifications</h1>
            <p className="text-body mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-card p-1 inline-flex">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary-100 text-primary-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-primary-100 text-primary-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-12 h-12" />}
              title={
                filter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"
              }
              description={
                filter === "unread"
                  ? "You're all caught up!"
                  : "Notifications will appear here"
              }
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}
                    >
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {notification.link && (
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {format(
                            new Date(notification.createdAt),
                            "MMM dd, yyyy 'at' h:mm a",
                          )}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
