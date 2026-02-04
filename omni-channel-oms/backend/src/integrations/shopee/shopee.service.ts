import { Injectable, Logger } from '@nestjs/common';
import {
  IMarketplaceIntegration,
  MarketplaceProduct,
  MarketplaceOrder,
} from '../interfaces/marketplace-integration.interface';

@Injectable()
export class ShopeeService implements IMarketplaceIntegration {
  private readonly logger = new Logger(ShopeeService.name);
  private mockProducts: Map<string, MarketplaceProduct> = new Map();
  private mockOrders: Map<string, MarketplaceOrder> = new Map();

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  async getProduct(
    itemId: string,
    variantId?: string,
  ): Promise<MarketplaceProduct> {
    const key = this.getProductKey(itemId, variantId);
    const product = this.mockProducts.get(key);

    if (!product) {
      throw new Error(`Product not found: ${itemId}`);
    }

    this.logger.log(
      `[Shopee] Get product: ${itemId}, variant: ${variantId || 'none'}`,
    );

    // Simulate API delay
    await this.delay(100);

    return product;
  }

  async updateStock(
    itemId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<void> {
    const key = this.getProductKey(itemId, variantId || undefined);
    const product = this.mockProducts.get(key);

    if (!product) {
      throw new Error(`Product not found: ${itemId}`);
    }

    product.stock = quantity;
    this.mockProducts.set(key, product);

    this.logger.log(
      `[Shopee] Updated stock for item ${itemId}, variant ${variantId || 'none'}: ${quantity}`,
    );

    // Simulate API delay
    await this.delay(150);
  }

  async getOrder(orderId: string): Promise<MarketplaceOrder> {
    const order = this.mockOrders.get(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    this.logger.log(`[Shopee] Get order: ${orderId}`);

    // Simulate API delay
    await this.delay(100);

    return order;
  }

  async syncProducts(): Promise<MarketplaceProduct[]> {
    this.logger.log('[Shopee] Syncing all products');

    // Simulate API delay
    await this.delay(300);

    return Array.from(this.mockProducts.values());
  }

  // Mock-specific methods
  createMockOrder(orderData: Partial<MarketplaceOrder>): MarketplaceOrder {
    const order: MarketplaceOrder = {
      orderId: orderData.orderId || `SHOPEE-${Date.now()}`,
      itemId: orderData.itemId!,
      variantId: orderData.variantId,
      quantity: orderData.quantity || 1,
      price: orderData.price || 100,
      customerName: orderData.customerName || 'Mock Customer',
      customerPhone: orderData.customerPhone || '1234567890',
      status: orderData.status || 'PENDING',
      createdAt: orderData.createdAt || new Date(),
    };

    this.mockOrders.set(order.orderId, order);
    this.logger.log(`[Shopee] Created mock order: ${order.orderId}`);

    return order;
  }

  createMockProduct(
    productData: Partial<MarketplaceProduct>,
  ): MarketplaceProduct {
    const product: MarketplaceProduct = {
      itemId: productData.itemId || `ITEM-${Date.now()}`,
      variantId: productData.variantId,
      name: productData.name || 'Mock Product',
      price: productData.price || 100,
      stock: productData.stock || 50,
    };

    const key = this.getProductKey(product.itemId, product.variantId);
    this.mockProducts.set(key, product);
    this.logger.log(`[Shopee] Created mock product: ${product.itemId}`);

    return product;
  }

  private initializeMockData(): void {
    // Create some mock products
    this.createMockProduct({
      itemId: 'SHOPEE-ITEM-001',
      name: 'Shopee T-Shirt Blue',
      price: 199.99,
      stock: 100,
    });

    this.createMockProduct({
      itemId: 'SHOPEE-ITEM-001',
      variantId: 'VAR-M',
      name: 'Shopee T-Shirt Blue (Size M)',
      price: 199.99,
      stock: 50,
    });

    this.createMockProduct({
      itemId: 'SHOPEE-ITEM-001',
      variantId: 'VAR-L',
      name: 'Shopee T-Shirt Blue (Size L)',
      price: 199.99,
      stock: 50,
    });
  }

  private getProductKey(itemId: string, variantId?: string): string {
    return variantId ? `${itemId}:${variantId}` : itemId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
