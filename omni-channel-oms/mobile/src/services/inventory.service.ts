/**
 * Inventory Service
 * Handles inventory-related API calls
 */

import apiClient from "./api";
import { Inventory } from "@types";

export interface AdjustStockDto {
  masterSkuId: string;
  variantSkuId?: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
}

class InventoryService {
  /**
   * Get all inventory items
   */
  async getInventory(): Promise<Inventory[]> {
    const response = await apiClient.get<Inventory[]>("/inventory");
    return response.data;
  }

  /**
   * Adjust stock quantity
   */
  async adjustStock(data: AdjustStockDto): Promise<Inventory> {
    const response = await apiClient.post<Inventory>("/inventory/adjust", data);
    return response.data;
  }

  /**
   * Get inventory audit logs
   */
  async getAuditLogs(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/inventory/audit");
    return response.data;
  }
}

export default new InventoryService();
