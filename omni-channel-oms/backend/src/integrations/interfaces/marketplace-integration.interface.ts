export interface MarketplaceProduct {
  itemId: string;
  variantId?: string;
  name: string;
  price: number;
  stock: number;
}

export interface MarketplaceOrder {
  orderId: string;
  itemId: string;
  variantId?: string;
  quantity: number;
  price: number;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: Date;
}

export interface IMarketplaceIntegration {
  /**
   * Get product details from marketplace
   */
  getProduct(itemId: string, variantId?: string): Promise<MarketplaceProduct>;

  /**
   * Update stock quantity on marketplace
   */
  updateStock(
    itemId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<void>;

  /**
   * Get order details from marketplace
   */
  getOrder(orderId: string): Promise<MarketplaceOrder>;

  /**
   * Sync all products from marketplace
   */
  syncProducts(): Promise<MarketplaceProduct[]>;
}
