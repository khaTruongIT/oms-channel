/**
 * Orders Service
 * Handles order-related API calls
 */

import apiClient from "./api";
import { Order, OrderFilterParams, OrderStatus } from "@types";

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

class OrdersService {
  /**
   * Get all orders with optional filters
   */
  async getOrders(params?: OrderFilterParams): Promise<Order[]> {
    const response = await apiClient.get<Order[]>("/orders", { params });
    return response.data;
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
