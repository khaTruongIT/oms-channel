/**
 * TypeScript Type Definitions
 */

// User Roles
export enum UserRole {
  OWNER = "OWNER",
  WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER",
  SALES_STAFF = "SALES_STAFF",
}

// Order Status
export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// Channel Types
export enum Channel {
  SHOPEE = "SHOPEE",
  TIKTOK = "TIKTOK",
  LAZADA = "LAZADA",
}

// User
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Tenant
export interface Tenant {
  id: string;
  name: string;
  schemaName: string;
  createdAt: string;
  updatedAt: string;
}

// User Tenant Role
export interface UserTenantRole {
  id: string;
  userId: string;
  tenantId: string;
  role: UserRole;
  tenant: Tenant;
}

// Auth Response
export interface AuthResponse {
  access_token: string;
  user: User;
  tenantRoles: UserTenantRole[];
}

// Product
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  category?: Category;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

// Product Variant
export interface ProductVariant {
  id: string;
  masterSkuId: string;
  variantSku: string;
  variantName: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Order
export interface Order {
  id: string;
  orderNumber: string;
  channel: Channel;
  channelOrderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: string;
  status: OrderStatus;
  totalAmount: number;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Order Item
export interface OrderItem {
  id: string;
  orderId: string;
  masterSkuId: string;
  variantSkuId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

// Inventory
export interface Inventory {
  id: string;
  masterSkuId: string;
  variantSkuId?: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  product?: Product;
  warehouse?: Warehouse;
  updatedAt: string;
}

// Warehouse
export interface Warehouse {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// API Error Response
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter params
export interface OrderFilterParams extends PaginationParams {
  channel?: Channel;
  status?: OrderStatus;
  search?: string;
}

export interface ProductFilterParams extends PaginationParams {
  categoryId?: string;
  search?: string;
}
