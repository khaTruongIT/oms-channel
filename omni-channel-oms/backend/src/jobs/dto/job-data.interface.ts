export interface StockSyncJob {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  schemaName: string;
  tenantId: string;
}

export interface BatchStockSyncJob {
  schemaName: string;
  tenantId: string;
}

export interface QueuedJobResponse {
  jobId: string | number | undefined;
  status: 'queued';
}
