"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import type { AdjustStockInput, InventoryItem } from "@/types/inventory";

export type { AdjustStockInput, InventoryItem } from "@/types/inventory";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useInventory() {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<InventoryItem[]>(
    "/inventory",
    fetcher,
  );

  return {
    inventory: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export async function adjustStock(data: AdjustStockInput) {
  const response = await api.post<InventoryItem>("/inventory/adjust", data);
  return response.data;
}
