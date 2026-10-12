"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import type {
  AdjustStockInput,
  GetInventoryFilters,
  GetMovementsFilters,
  InventoryItem,
  InventoryMovementItem,
  TransferStockInput,
  UpdateSafetyStockInput,
} from "@/types/inventory";

export type {
  AdjustStockInput,
  GetInventoryFilters,
  GetMovementsFilters,
  InventoryItem,
  InventoryMovementItem,
  TransferStockInput,
  UpdateSafetyStockInput,
} from "@/types/inventory";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function buildInventoryUrl(filters?: GetInventoryFilters): string {
  if (!filters) return "/inventory";
  const params = new URLSearchParams();
  if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);
  if (filters.masterSkuId) params.set("masterSkuId", filters.masterSkuId);
  if (filters.lowStock !== undefined) params.set("lowStock", String(filters.lowStock));
  if (filters.q) params.set("q", filters.q);
  if (filters.page !== undefined && filters.page !== null) params.set("page", String(filters.page));
  if (filters.limit !== undefined && filters.limit !== null) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `/inventory?${query}` : "/inventory";
}

export function buildMovementsUrl(filters?: GetMovementsFilters): string {
  if (!filters) return "/inventory/movements";
  const params = new URLSearchParams();
  if (filters.masterSkuId) params.set("masterSkuId", filters.masterSkuId);
  if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);
  if (filters.orderId) params.set("orderId", filters.orderId);
  if (filters.movementType) params.set("movementType", filters.movementType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page !== undefined && filters.page !== null) params.set("page", String(filters.page));
  if (filters.limit !== undefined && filters.limit !== null) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `/inventory/movements?${query}` : "/inventory/movements";
}

export function useInventory(filters?: GetInventoryFilters) {
  const url = buildInventoryUrl(filters);
  const { data, error, isLoading, mutate } = useTenantScopedSWR<
    InventoryItem[] | { data: InventoryItem[]; meta: any }
  >(url, fetcher);

  const inventory = Array.isArray(data) ? data : data?.data || [];
  const meta = Array.isArray(data) ? undefined : data?.meta;

  return {
    inventory,
    meta,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useInventoryMovements(filters?: GetMovementsFilters) {
  const url = buildMovementsUrl(filters);
  const { data, error, isLoading, mutate } = useTenantScopedSWR<
    InventoryMovementItem[] | { data: InventoryMovementItem[]; meta: any }
  >(url, fetcher);

  const movements = Array.isArray(data) ? data : data?.data || [];
  const meta = Array.isArray(data) ? undefined : data?.meta;

  return {
    movements,
    meta,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProductInventory(masterSkuId?: string) {
  const url = masterSkuId ? `/inventory/product/${masterSkuId}` : null;
  const { data, error, isLoading, mutate } = useTenantScopedSWR<InventoryItem[]>(
    url,
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

export async function transferStock(data: TransferStockInput) {
  const response = await api.post<{
    source: InventoryItem;
    destination: InventoryItem;
  }>("/inventory/transfer", data);
  return response.data;
}

export async function updateSafetyStock(data: UpdateSafetyStockInput) {
  const response = await api.put<InventoryItem>(
    "/inventory/safety-stock",
    data,
  );
  return response.data;
}
