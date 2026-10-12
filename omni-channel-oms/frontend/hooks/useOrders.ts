"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import type {
  BulkUpdateOrderStatusInput,
  BulkUpdateOrderStatusResult,
  CreateOrderInput,
  Order,
  OrderFilters,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
} from "@/types/orders";

export type {
  BulkUpdateOrderStatusInput,
  BulkUpdateOrderStatusResult,
  CreateOrderInput,
  Order,
  OrderFilters,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
} from "@/types/orders";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function buildOrdersUrl(filters?: OrderFilters): string {
  const params = new URLSearchParams();
  if (filters?.channel) params.set("channel", filters.channel);
  if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters?.externalOrderId) params.set("externalOrderId", filters.externalOrderId);
  if (filters?.channelAccountId) params.set("channelAccountId", filters.channelAccountId);
  if (filters?.customerId) params.set("customerId", filters.customerId);
  if (filters?.q) params.set("q", filters.q);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.page !== undefined && filters.page !== null) params.set("page", String(filters.page));
  if (filters?.limit !== undefined && filters.limit !== null) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

export function useOrders(filters?: OrderFilters | string) {
  const url = typeof filters === "string" ? `/orders?channel=${filters}` : buildOrdersUrl(filters);
  const { data, error, isLoading, mutate } = useTenantScopedSWR<Order[]>(url, fetcher);

  return {
    orders: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useOrder(id: string) {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<Order>(
    id ? `/orders/${id}` : null,
    fetcher,
  );

  return {
    order: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useOrderItems(orderId: string) {
  const { data, error, isLoading } = useTenantScopedSWR<OrderItem[]>(
    orderId ? `/orders/${orderId}/items` : null,
    fetcher,
  );

  return {
    items: data || [],
    isLoading,
    isError: error,
  };
}

export function useOrderTimeline(orderId: string) {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<OrderTimelineEvent[]>(
    orderId ? `/orders/${orderId}/timeline` : null,
    fetcher,
  );

  return {
    events: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createOrder(orderData: CreateOrderInput) {
  const { data } = await api.post<Order>("/orders", orderData);
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reason?: string,
) {
  const payload: { status: OrderStatus; reason?: string } = { status };
  if (reason !== undefined) {
    payload.reason = reason;
  }
  const { data } = await api.put<Order>(`/orders/${id}/status`, payload);
  return data;
}

export async function bulkUpdateOrderStatus(
  input: BulkUpdateOrderStatusInput,
): Promise<BulkUpdateOrderStatusResult> {
  const { data } = await api.post<BulkUpdateOrderStatusResult>(
    "/orders/bulk-status",
    input,
  );
  return data;
}
