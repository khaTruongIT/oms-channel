import { Injectable, Logger } from '@nestjs/common';
import {
  IMarketplaceIntegration,
  MarketplaceProduct,
  MarketplaceOrder,
} from '../interfaces/marketplace-integration.interface';

@Injectable()
export class TiktokService implements IMarketplaceIntegration {
  private readonly logger = new Logger(TiktokService.name);
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
      `[TikTok] Get product: ${itemId}, variant: ${variantId || 'none'}`,
    );
    await this.delay(120);

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
      `[TikTok] Updated stock for item ${itemId}, variant ${variantId || 'none'}: ${quantity}`,
    );

    await this.delay(180);
  }

  async getOrder(orderId: string): Promise<MarketplaceOrder> {
    const order = this.mockOrders.get(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    this.logger.log(`[TikTok] Get order: ${orderId}`);
    await this.delay(110);

    return order;
  }

  async syncProducts(): Promise<MarketplaceProduct[]> {
    this.logger.log('[TikTok] Syncing all products');
    await this.delay(350);

    return Array.from(this.mockProducts.values());
  }

  createMockOrder(orderData: Partial<MarketplaceOrder>): MarketplaceOrder {
    const order: MarketplaceOrder = {
      orderId: orderData.orderId || `TIKTOK-${Date.now()}`,
      itemId: orderData.itemId!,
      variantId: orderData.variantId,
      quantity: orderData.quantity || 1,
      price: orderData.price || 100,
      customerName: orderData.customerName || 'TikTok Customer',
      customerPhone: orderData.customerPhone || '0987654321',
      status: orderData.status || 'PENDING',
      createdAt: orderData.createdAt || new Date(),
    };

    this.mockOrders.set(order.orderId, order);
    this.logger.log(`[TikTok] Created mock order: ${order.orderId}`);

    return order;
  }

  private initializeMockData(): void {
    this.mockProducts.set('TIKTOK-ITEM-001', {
      itemId: 'TIKTOK-ITEM-001',
      name: 'TikTok Hoodie Black',
      price: 299.99,
      stock: 75,
    });
  }

  private getProductKey(itemId: string, variantId?: string): string {
    return variantId ? `${itemId}:${variantId}` : itemId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
