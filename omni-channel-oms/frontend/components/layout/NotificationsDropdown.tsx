/**
 * NotificationsDropdown Component
 * Displays real-time notifications bell with unread badge and dropdown menu
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await markAsRead(item.id);
      } catch {}
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in fade-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Không có thông báo nào
              </div>
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.read ? "bg-sky-50/40" : ""
                  }`}
                >
                  <div className="mt-0.5">{getSeverityIcon(item.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs truncate ${
                          !item.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {item.message || item.body}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                      {item.link && <ExternalLink className="w-3 h-3 text-gray-400" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/notifications");
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer w-full py-1"
            >
              Xem tất cả thông báo ({notifications.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
