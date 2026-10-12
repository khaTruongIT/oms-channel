/**
 * useReports Hook - Sprint 5.1 (S5.1.4, S5.1.5)
 * Analytics & reporting hooks for sales, inventory valuation, and top SKUs
 */

"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import { isFeatureEnabled } from "@/lib/features";

export interface SalesReportItem {
  period?: string;
  channel?: string;
  orders: number;
  sales: number;
}

export interface InventoryCategoryValuation {
  category: string;
  skuCount: number;
  available: number;
  reserved: number;
  lowStock: number;
  valuation: number;
}

export interface InventoryValueResponse {
  categories: InventoryCategoryValuation[];
  summary: {
    totalQuantity: number;
    totalReserved: number;
    totalValuation: number;
    totalSkus: number;
    lowStockCount: number;
  };
}

export interface TopSkuItem {
  masterSkuId: string;
  sku: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function buildSalesReportUrl(params?: {
  from?: string;
  to?: string;
  groupBy?: "day" | "channel";
}): string {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.groupBy) query.set("groupBy", params.groupBy);
  return `/reports/sales?${query.toString()}`;
}

export function buildTopSkusUrl(params?: {
  from?: string;
  to?: string;
  limit?: number;
}): string {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.limit) query.set("limit", String(params.limit));
  return `/reports/top-skus?${query.toString()}`;
}

export function useSalesReport(params?: {
  from?: string;
  to?: string;
  groupBy?: "day" | "channel";
}) {
  const isEnabled = isFeatureEnabled("reports");
  const url = isEnabled && params?.from && params?.to
    ? buildSalesReportUrl(params)
    : null;

  const { data, error, isLoading, mutate } = useTenantScopedSWR<SalesReportItem[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  return {
    salesData: data || [],
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}

export function useInventoryValueReport() {
  const isEnabled = isFeatureEnabled("reports");
  const url = isEnabled ? "/reports/inventory-value" : null;

  const { data, error, isLoading, mutate } = useTenantScopedSWR<InventoryValueResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  return {
    inventoryReport: data,
    categories: data?.categories || [],
    summary: data?.summary || {
      totalQuantity: 0,
      totalReserved: 0,
      totalValuation: 0,
      totalSkus: 0,
      lowStockCount: 0,
    },
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}

export function useTopSkusReport(params?: {
  from?: string;
  to?: string;
  limit?: number;
}) {
  const isEnabled = isFeatureEnabled("reports");
  const url = isEnabled && params?.from && params?.to
    ? buildTopSkusUrl(params)
    : null;

  const { data, error, isLoading, mutate } = useTenantScopedSWR<TopSkuItem[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    },
  );

  return {
    topSkus: data || [],
    isLoading: isEnabled ? isLoading : false,
    isError: isEnabled ? error : null,
    mutate,
  };
}
