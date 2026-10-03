/**
 * useCustomers Hook
 * Customer data management with SWR
 */

"use client";

import useSWR from "swr";

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCustomers() {
  const { data, error, isLoading, mutate } = useSWR<Customer[]>(
    "/api/customers",
    fetcher,
  );

  return {
    customers: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCustomer(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Customer>(
    id ? `/api/customers/${id}` : null,
    fetcher,
  );

  return {
    customer: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createCustomer(data: Partial<Customer>) {
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create customer");
  }

  return response.json();
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const response = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update customer");
  }

  return response.json();
}

export async function deleteCustomer(id: string) {
  const response = await fetch(`/api/customers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete customer");
  }

  return response.json();
}
