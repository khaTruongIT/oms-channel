export interface CustomerRecord {
  id: string;
  full_name: string;
  phone: string;
  raw_phone: string | null;
  email: string | null;
  total_orders: number;
  total_spent: string | number;
  last_order_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  channel: string;
  status: string;
  totalAmount: number;
  createdAt: Date | string;
}

export interface CustomerWithRecentOrders {
  id: string;
  fullName: string;
  phone: string;
  rawPhone?: string | null;
  email?: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: Date | string | null;
  createdAt: Date | string;
  recentOrders: CustomerOrderSummary[];
}
