export type ChannelProvider = "shopee" | "tiktok" | "lazada" | "manual";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderProductSummary {
  sku?: string;
  name?: string;
  skuCode?: string;
  productName?: string;
}

export interface OrderItem {
  id: string;
  masterSkuId: string;
  warehouseId?: string | null;
  quantity: number;
  unitPrice: number;
  product?: OrderProductSummary;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: ChannelProvider | string;
  channelAccountId?: string | null;
  externalOrderId: string;
  externalStatus?: string | null;
  externalStatusUpdatedAt?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  cancelReason?: string;
  allowedTransitions?: OrderStatus[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  channel?: string;
  status?: OrderStatus | "ALL";
  externalOrderId?: string;
  channelAccountId?: string;
  customerId?: string;
  q?: string;
  from?: string;
  to?: string;
  sort?: string;
}

export interface CreateOrderItemInput {
  masterSkuId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  channel: string;
  externalOrderId: string;
  customerName?: string;
  customerPhone?: string;
  channelAccountId?: string;
  warehouseId: string;
  items: CreateOrderItemInput[];
}

export interface OrderTimelineEvent {
  id: string;
  type: "AUDIT" | "INVENTORY";
  event: string;
  description: string;
  actorId?: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface BulkStatusItemError {
  id: string;
  code: string;
  message: string;
}

export interface BulkUpdateOrderStatusResult {
  succeeded: string[];
  failed: BulkStatusItemError[];
  total: number;
  successCount: number;
  failureCount: number;
}

export interface BulkUpdateOrderStatusInput {
  orderIds: string[];
  status: OrderStatus;
  reason?: string;
  idempotencyKey?: string;
}
