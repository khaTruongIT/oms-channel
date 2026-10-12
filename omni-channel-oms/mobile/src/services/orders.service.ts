/**
 * Orders Service
 * Handles order-related API calls
 */

import apiClient from "./api";
import { Order, OrderFilterParams, OrderStatus } from "@types";

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  reason?: string;
}

export interface OrdersPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  meta: OrdersPaginationMeta;
}

class OrdersService {
  /**
   * Get all orders with optional filters and pagination
   */
  async getOrders(params?: OrderFilterParams): Promise<PaginatedOrdersResult> {
    const queryParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      ...params,
    };

    const response = await apiClient.get<any>("/orders", { params: queryParams });
    const rawData = response.data;

    // Case 1: Enveloped pagination response { data: Order[], meta: { ... } }
    if (rawData && Array.isArray(rawData.data) && rawData.meta) {
      const meta = rawData.meta;
      const total = typeof meta.total === "number" ? meta.total : rawData.data.length;
      const totalPages =
        typeof meta.totalPages === "number"
          ? meta.totalPages
          : Math.ceil(total / queryParams.limit) || 1;

      return {
        orders: rawData.data,
        meta: {
          page: meta.page ?? queryParams.page,
          limit: meta.limit ?? queryParams.limit,
          total,
          totalPages,
          hasNextPage:
            typeof meta.hasNextPage === "boolean"
              ? meta.hasNextPage
              : queryParams.page < totalPages,
          hasPrevPage:
            typeof meta.hasPrevPage === "boolean"
              ? meta.hasPrevPage
              : queryParams.page > 1,
        },
      };
    }

    // Case 2: Legacy raw array response Order[]
    if (Array.isArray(rawData)) {
      return {
        orders: rawData,
        meta: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: rawData.length,
          totalPages: Math.ceil(rawData.length / queryParams.limit) || 1,
          hasNextPage: false,
          hasPrevPage: queryParams.page > 1,
        },
      };
    }

    return {
      orders: [],
      meta: {
        page: 1,
        limit: queryParams.limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  }

  /**
   * Get order items
   */
  async getOrderItems(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}/items`);
    return response.data;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
  ): Promise<Order> {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, data);
    return response.data;
  }
}

export default new OrdersService();
