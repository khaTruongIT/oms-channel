/**
 * Products Service
 * Handles product-related API calls
 */

import apiClient from "./api";
import { Product, ProductFilterParams } from "@types";

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
}

class ProductsService {
  /**
   * Get all products with optional filters
   */
  async getProducts(params?: ProductFilterParams): Promise<Product[]> {
    const response = await apiClient.get<Product[]>("/products", { params });
    return response.data;
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<Product>("/products", data);
    return response.data;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }
}

export default new ProductsService();
