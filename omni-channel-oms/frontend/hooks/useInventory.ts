"use client";

import useSWR from "swr";
import api from "@/lib/api";
import type { AdjustStockInput, InventoryItem } from "@/types/inventory";

export type { AdjustStockInput, InventoryItem } from "@/types/inventory";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR<InventoryItem[]>(
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
