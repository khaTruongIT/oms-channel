"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import type {
  CreateOrderInput,
  Order,
  OrderFilters,
  OrderItem,
  OrderStatus,
} from "@/types/orders";

export type { CreateOrderInput, Order, OrderFilters, OrderItem, OrderStatus } from "@/types/orders";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

function buildOrdersUrl(filters?: OrderFilters): string {
  const params = new URLSearchParams();
  if (filters?.channel) params.set("channel", filters.channel);
  if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters?.externalOrderId) params.set("externalOrderId", filters.externalOrderId);
  if (filters?.channelAccountId) params.set("channelAccountId", filters.channelAccountId);

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

export async function createOrder(orderData: CreateOrderInput) {
  const { data } = await api.post<Order>("/orders", orderData);
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data } = await api.put<Order>(`/orders/${id}/status`, { status });
  return data;
}
