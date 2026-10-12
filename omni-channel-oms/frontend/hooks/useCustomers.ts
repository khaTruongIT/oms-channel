/**
 * @deprecated Gated until Sprint 4 (Customer management derived from orders).
 * useCustomers Hook
 */

"use client";

import useSWR from "swr";
import { isFeatureEnabled } from "@/lib/features";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

const emptyCustomers: Customer[] = [];

/**
 * @deprecated Gated by NEXT_PUBLIC_FEATURE_CUSTOMERS until Sprint 4
 */
export function useCustomers() {
  const isEnabled = isFeatureEnabled("customers");
  const { data, error, isLoading, mutate } = useSWR<Customer[]>(
    isEnabled ? "/api/customers" : null,
  );

  return {
    customers: isEnabled ? (data || emptyCustomers) : emptyCustomers,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}

/**
 * @deprecated Gated by NEXT_PUBLIC_FEATURE_CUSTOMERS until Sprint 4
 */
export function useCustomer(id: string) {
  const isEnabled = isFeatureEnabled("customers");
  const { data, error, isLoading, mutate } = useSWR<Customer>(
    isEnabled && id ? `/api/customers/${id}` : null,
  );

  return {
    customer: isEnabled ? data : undefined,
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}

export async function createCustomer(_data: Partial<Customer>) {
  throw new Error("Customer creation is under development");
}

export async function updateCustomer(_id: string, _data: Partial<Customer>) {
  throw new Error("Customer updates are under development");
}

export async function deleteCustomer(_id: string) {
  throw new Error("Customer deletion is under development");
}
