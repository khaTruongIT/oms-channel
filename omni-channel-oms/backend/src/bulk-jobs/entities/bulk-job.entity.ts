export enum BulkJobType {
  PRODUCT_IMPORT = 'PRODUCT_IMPORT',
  INVENTORY_IMPORT = 'INVENTORY_IMPORT',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  EXPORT = 'EXPORT',
}

export enum BulkJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface BulkJobError {
  row: number;
  field?: string;
  message: string;
  sku?: string;
}

export interface BulkJobRecord {
  id: string;
  type: BulkJobType;
  status: BulkJobStatus;
  total: number;
  processed: number;
  failed: number;
  error_report: BulkJobError[];
  payload?: any;
  idempotency_key?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
