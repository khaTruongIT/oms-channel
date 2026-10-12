export interface InventoryProductSummary {
  sku?: string;
  name?: string;
  skuCode?: string;
  productName?: string;
}

export interface InventoryWarehouseSummary {
  name: string;
}

export interface InventoryItem {
  id: string;
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  safetyStock: number;
  availableQuantity?: number;
  ats?: number;
  skuCode?: string;
  productName?: string;
  warehouseName?: string;
  product?: InventoryProductSummary;
  warehouse?: InventoryWarehouseSummary;
  updatedAt?: string | Date;
}

export type InventoryMovementType =
  | "ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ORDER_RESERVE"
  | "ORDER_RELEASE"
  | "ORDER_DEDUCT"
  | "PURCHASE_RECEIPT"
  | "RETURN_RESTOCK"
  | "CYCLE_COUNT";

export interface InventoryMovementItem {
  id: string;
  inventoryId: string;
  masterSkuId: string;
  skuCode?: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  orderId?: string;
  movementType: InventoryMovementType | string;
  quantityDelta: number;
  reservedDelta: number;
  idempotencyKey?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

export interface AdjustStockInput {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  idempotencyKey: string;
}

export interface TransferStockInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  masterSkuId: string;
  quantity: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface UpdateSafetyStockInput {
  masterSkuId: string;
  warehouseId: string;
  safetyStock: number;
}

export interface GetInventoryFilters {
  warehouseId?: string;
  masterSkuId?: string;
  lowStock?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}

export interface GetMovementsFilters {
  masterSkuId?: string;
  warehouseId?: string;
  orderId?: string;
  movementType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface WarehouseSummary {
  warehouseId: string;
  totalSkus: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  totalStockValue: number;
}

export function calculateAvailableToSell(item: InventoryItem): number {
  if (typeof item.ats === "number") {
    return item.ats;
  }
  if (typeof item.availableQuantity === "number") {
    return item.availableQuantity;
  }
  return Math.max(0, item.quantity - item.reservedQuantity - item.safetyStock);
}
