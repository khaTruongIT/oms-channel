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
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  channel?: string;
  status?: OrderStatus | "ALL";
  externalOrderId?: string;
  channelAccountId?: string;
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

