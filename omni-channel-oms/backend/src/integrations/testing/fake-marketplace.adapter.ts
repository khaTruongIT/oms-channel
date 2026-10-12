import {
  IMarketplaceIntegration,
  MarketplaceOrder,
  MarketplaceProduct,
} from '../interfaces/marketplace-integration.interface';

export interface StockUpdateRecord {
  itemId: string;
  variantId: string | null;
  quantity: number;
  timestamp: Date;
}

export class FakeMarketplaceAdapter implements IMarketplaceIntegration {
  public failNextStockUpdates = 0;
  public stockUpdates: StockUpdateRecord[] = [];
  public products: Map<string, MarketplaceProduct> = new Map();
  public orders: Map<string, MarketplaceOrder> = new Map();

  reset(): void {
    this.failNextStockUpdates = 0;
    this.stockUpdates = [];
    this.products.clear();
    this.orders.clear();
  }

  seedProduct(product: MarketplaceProduct): void {
    const key = `${product.itemId}:${product.variantId || 'default'}`;
    this.products.set(key, product);
  }

  seedOrder(order: MarketplaceOrder): void {
    this.orders.set(order.orderId, order);
  }

  async getProduct(
    itemId: string,
    variantId?: string,
  ): Promise<MarketplaceProduct> {
    const key = `${itemId}:${variantId || 'default'}`;
    const product = this.products.get(key);
    if (!product) {
      throw new Error(`Product not found on marketplace: ${itemId}`);
    }
    return product;
  }

  async updateStock(
    itemId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<void> {
    if (this.failNextStockUpdates > 0) {
      this.failNextStockUpdates--;
      throw new Error('Marketplace network gateway timeout (simulated)');
    }

    this.stockUpdates.push({
      itemId,
      variantId,
      quantity,
      timestamp: new Date(),
    });

    const key = `${itemId}:${variantId || 'default'}`;
    const product = this.products.get(key);
    if (product) {
      product.stock = quantity;
    }
  }

  async getOrder(orderId: string): Promise<MarketplaceOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found on marketplace: ${orderId}`);
    }
    return order;
  }

  async syncProducts(): Promise<MarketplaceProduct[]> {
    return Array.from(this.products.values());
  }
}
