import type { Product } from "@optiqis/shared";

export interface OmsMasterSku {
  id: string;
  skuCode: string;
  productName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  variants?: unknown;
  costPrice?: number;
  publicMetadata?: Partial<Product> | null;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface OmsProductCreateInput {
  skuCode: string;
  productName: string;
  categoryName: string;
  publicMetadata: Omit<Product, "id" | "name" | "line">;
}

export interface OmsProductUpdateInput {
  productName?: string;
  categoryName?: string;
  categoryId?: string;
  publicMetadata?: Omit<Product, "id" | "name" | "line">;
}

export interface OmsInventoryItem {
  id: string;
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  safetyStock: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface OmsWarehouse {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface OmsAdjustInventoryInput {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
}

export type OmsStatusState = "disabled" | "connected" | "degraded";
export type OmsStatusCheckState = "pass" | "fail" | "skipped";

export interface OmsStatusCheck {
  ok: boolean;
  state: OmsStatusCheckState;
  message: string;
}

export interface OmsStatus {
  enabled: boolean;
  state: OmsStatusState;
  message: string;
  checkedAt: string;
  checks: {
    configuration: OmsStatusCheck;
    authentication: OmsStatusCheck;
    products: OmsStatusCheck;
    warehouses: OmsStatusCheck;
  };
}
