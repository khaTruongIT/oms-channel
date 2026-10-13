"use client";

import { ReactNode } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Circle,
} from "lucide-react";
import type { OrderStatus } from "@/types/orders";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-secondary-100 text-secondary-700",
    success: "bg-success-light text-success-dark",
    warning: "bg-warning-light text-warning-dark",
    danger: "bg-danger-light text-danger-dark",
    info: "bg-info-light text-info-dark",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  const icons = {
    default: Circle,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: XCircle,
    info: Info,
  };
  const Icon = icons[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-wide ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}

// Stock status badge helper
export function StockStatusBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  } else if (quantity < 10) {
    return <Badge variant="warning">Low Stock</Badge>;
  }
  return <Badge variant="success">In Stock</Badge>;
}

// Order status badge helper
export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const statusVariants: Record<
    OrderStatus,
    "default" | "success" | "warning" | "danger" | "info"
  > = {
    PENDING: "warning",
    CONFIRMED: "info",
    PROCESSING: "info",
    SHIPPED: "info",
    DELIVERED: "success",
    CANCELLED: "danger",
  };

  return (
    <Badge variant={status in statusVariants ? statusVariants[status as OrderStatus] : "default"}>
      {status}
    </Badge>
  );
}
