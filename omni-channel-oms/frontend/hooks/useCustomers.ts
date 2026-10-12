/**
 * useCustomers Hook - Sprint 4.3 (E4B, D1-D2)
 * Customer management derived from omnichannel orders.
 * Tenant-scoped SWR to /customers with search, pagination, and sorting.
 */

"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import { isFeatureEnabled } from "@/lib/features";

export interface Customer {
  id: string;
  fullName: string;
  name?: string;
  phone: string;
  rawPhone?: string | null;
  email?: string | null;
  address?: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  createdAt: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  channel: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface CustomerWithRecentOrders extends Customer {
  recentOrders: CustomerOrderSummary[];
}

export interface CustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseCustomersOptions {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "total_spent" | "total_orders" | "created_at" | "last_order_at";
  sortOrder?: "ASC" | "DESC";
}

const emptyCustomers: Customer[] = [];

export function buildCustomersUrl(options?: UseCustomersOptions): string {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.q?.trim()) params.set("q", options.q.trim());
  if (options?.sortBy) params.set("sortBy", options.sortBy);
  if (options?.sortOrder) params.set("sortOrder", options.sortOrder);

  const query = params.toString();
  return query ? `/customers?${query}` : "/customers";
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useCustomers(options?: UseCustomersOptions) {
  const isEnabled = isFeatureEnabled("customers");
  const url = isEnabled ? buildCustomersUrl(options) : null;

  const { data, error, isLoading, mutate } = useTenantScopedSWR<CustomersResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  const rawItems = data?.items || emptyCustomers;
  const customers: Customer[] = rawItems.map((c) => ({
    ...c,
    name: c.fullName || c.name || "Khách hàng",
  }));

  return {
    customers,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    page: data?.page ?? (options?.page ?? 1),
    limit: data?.limit ?? (options?.limit ?? 20),
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}

export function useCustomer(id?: string | null) {
  const isEnabled = isFeatureEnabled("customers");
  const url = isEnabled && id ? `/customers/${id}` : null;

  const { data, error, isLoading, mutate } = useTenantScopedSWR<CustomerWithRecentOrders>(
    url,
    fetcher,
  );

  const customer: CustomerWithRecentOrders | undefined = data
    ? {
        ...data,
        name: data.fullName || data.name || "Khách hàng",
      }
    : undefined;

  return {
    customer: isEnabled ? customer : undefined,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}

/**
 * @deprecated Customers are automatically derived from marketplace orders (E4B, D2).
 */
export async function createCustomer(_data: Partial<Customer>): Promise<Customer> {
  throw new Error("Khách hàng được tổng hợp tự động từ đơn hàng và không thể tạo thủ công.");
}

/**
 * @deprecated Customers are automatically derived from marketplace orders (E4B, D2).
 */
export async function updateCustomer(_id: string, _data: Partial<Customer>): Promise<Customer> {
  throw new Error("Khách hàng được tổng hợp tự động từ đơn hàng và không thể sửa thủ công.");
}

/**
 * @deprecated Customers are automatically derived from marketplace orders (E4B, D2).
 */
export async function deleteCustomer(_id: string): Promise<void> {
  throw new Error("Khách hàng được tổng hợp tự động từ đơn hàng và không thể xóa thủ công.");
}
