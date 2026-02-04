export interface StockSyncJob {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  schemaName: string;
}

export interface BatchStockSyncJob {
  schemaName: string;
  tenantId: string;
}
