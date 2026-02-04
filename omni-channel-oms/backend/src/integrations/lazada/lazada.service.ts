import { Injectable, Logger } from '@nestjs/common';
import {
  IMarketplaceIntegration,
  MarketplaceProduct,
  MarketplaceOrder,
} from '../interfaces/marketplace-integration.interface';

@Injectable()
export class LazadaService implements IMarketplaceIntegration {
  private readonly logger = new Logger(LazadaService.name);
  private mockProducts: Map<string, MarketplaceProduct> = new Map();
  private mockOrders: Map<string, MarketplaceOrder> = new Map();

  constructor() {
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
      `[Lazada] Get product: ${itemId}, variant: ${variantId || 'none'}`,
    );
    await this.delay(90);

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
      `[Lazada] Updated stock for item ${itemId}, variant ${variantId || 'none'}: ${quantity}`,
    );

    await this.delay(160);
  }

  async getOrder(orderId: string): Promise<MarketplaceOrder> {
    const order = this.mockOrders.get(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    this.logger.log(`[Lazada] Get order: ${orderId}`);
    await this.delay(95);

    return order;
  }

  async syncProducts(): Promise<MarketplaceProduct[]> {
    this.logger.log('[Lazada] Syncing all products');
    await this.delay(280);

    return Array.from(this.mockProducts.values());
  }

  createMockOrder(orderData: Partial<MarketplaceOrder>): MarketplaceOrder {
    const order: MarketplaceOrder = {
      orderId: orderData.orderId || `LAZADA-${Date.now()}`,
      itemId: orderData.itemId!,
      variantId: orderData.variantId,
      quantity: orderData.quantity || 1,
      price: orderData.price || 100,
      customerName: orderData.customerName || 'Lazada Customer',
      customerPhone: orderData.customerPhone || '5551234567',
      status: orderData.status || 'PENDING',
      createdAt: orderData.createdAt || new Date(),
    };

    this.mockOrders.set(order.orderId, order);
    this.logger.log(`[Lazada] Created mock order: ${order.orderId}`);

    return order;
  }

  private initializeMockData(): void {
    this.mockProducts.set('LAZADA-ITEM-001', {
      itemId: 'LAZADA-ITEM-001',
      name: 'Lazada Sneakers White',
      price: 599.99,
      stock: 30,
    });
  }

  private getProductKey(itemId: string, variantId?: string): string {
    return variantId ? `${itemId}:${variantId}` : itemId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
