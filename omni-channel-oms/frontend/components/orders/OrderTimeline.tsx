"use client";

import { useOrderTimeline } from "@/hooks/useOrders";
import { format } from "date-fns";
import {
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface OrderTimelineProps {
  orderId: string;
}

export default function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { events, isLoading, isError } = useOrderTimeline(orderId);

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span className="ml-2 text-sm text-body">Loading timeline...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-danger flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Failed to load timeline events.</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-body text-center py-4">
        No timeline events recorded yet.
      </p>
    );
  }

  const getEventBadge = (type: "AUDIT" | "INVENTORY", eventName: string) => {
    if (eventName === "ORDER_CREATED") {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        bg: "bg-emerald-50 border-emerald-200",
        color: "text-emerald-700",
      };
    }
    if (eventName === "ORDER_STATUS_CHANGED") {
      return {
        icon: <ArrowRightLeft className="w-4 h-4 text-blue-600" />,
        bg: "bg-blue-50 border-blue-200",
        color: "text-blue-700",
      };
    }
    if (eventName === "CANCELLED" || eventName.includes("CANCEL")) {
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        bg: "bg-red-50 border-red-200",
        color: "text-red-700",
      };
    }
    if (type === "INVENTORY") {
      if (eventName === "RESERVE") {
        return {
          icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
          bg: "bg-amber-50 border-amber-200",
          color: "text-amber-700",
        };
      }
      if (eventName === "RELEASE" || eventName === "RESTOCK") {
        return {
          icon: <RotateCcw className="w-4 h-4 text-teal-600" />,
          bg: "bg-teal-50 border-teal-200",
          color: "text-teal-700",
        };
      }
      return {
        icon: <Package className="w-4 h-4 text-indigo-600" />,
        bg: "bg-indigo-50 border-indigo-200",
        color: "text-indigo-700",
      };
    }

    return {
      icon: <Clock className="w-4 h-4 text-gray-600" />,
      bg: "bg-gray-50 border-gray-200",
      color: "text-gray-700",
    };
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary-200">
      {events.map((item) => {
        const style = getEventBadge(item.type, item.event);
        const eventDate = new Date(item.timestamp);
        const formattedDate = !isNaN(eventDate.getTime())
          ? format(eventDate, "MMM dd, yyyy 'at' HH:mm:ss")
          : String(item.timestamp);

        return (
          <div key={item.id} className="relative group">
            {/* Dot */}
            <div
              className={`absolute -left-6 mt-1 flex h-6 w-6 items-center justify-center rounded-full border bg-white ${style.bg}`}
            >
              {style.icon}
            </div>

            <div className="rounded-lg border border-border bg-white p-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.color}`}
                  >
                    {item.event}
                  </span>
                  <span className="text-xs text-body font-mono">
                    [{item.type}]
                  </span>
                </div>
                <time className="text-xs text-body">{formattedDate}</time>
              </div>

              <p className="mt-2 text-sm text-heading">{item.description}</p>

              {item.data && Object.keys(item.data).length > 0 && (
                <div className="mt-2 rounded bg-secondary-50 p-2 text-xs font-mono text-body overflow-x-auto">
                  {Object.entries(item.data).map(([key, val]) => (
                    <div key={key} className="flex gap-1">
                      <span className="font-semibold text-heading">{key}:</span>
                      <span>
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
