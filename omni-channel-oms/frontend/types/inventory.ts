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
  product?: InventoryProductSummary;
  warehouse?: InventoryWarehouseSummary;
}

export interface AdjustStockInput {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  idempotencyKey: string;
}

export function calculateAvailableToSell(item: InventoryItem): number {
  return Math.max(0, item.quantity - item.reservedQuantity - item.safetyStock);
}

