import ordersReducer, {
  fetchOrders,
  fetchMoreOrders,
  setFilters,
  clearError,
} from "./ordersSlice";
import { ordersService } from "@services";
import type { Order } from "@types";

jest.mock("@services", () => ({
  ordersService: {
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
  },
}));

describe("ordersSlice with paginated orders (S2.1.10)", () => {
  const mockOrder1: Order = {
    id: "ord-1",
    orderNumber: "ORD-001",
    channel: "shopee",
    channelOrderId: "SHP-1",
    customerName: "Alice",
    shippingAddress: "123 Main St",
    status: "PENDING",
    totalAmount: 100,
    createdAt: "2026-10-12T00:00:00Z",
    updatedAt: "2026-10-12T00:00:00Z",
  };

  const mockOrder2: Order = {
    id: "ord-2",
    orderNumber: "ORD-002",
    channel: "tiktok",
    channelOrderId: "TT-2",
    customerName: "Bob",
    shippingAddress: "456 Oak St",
    status: "CONFIRMED",
    totalAmount: 200,
    createdAt: "2026-10-12T00:00:00Z",
    updatedAt: "2026-10-12T00:00:00Z",
  };

  it("handles fetchOrders.fulfilled with paginated response", () => {
    const initialState = ordersReducer(undefined, { type: "@@INIT" });

    const paginatedPayload = {
      orders: [mockOrder1],
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    };

    const nextState = ordersReducer(
      initialState,
      fetchOrders.fulfilled(paginatedPayload, "req-1", undefined),
    );

    expect(nextState.orders).toEqual([mockOrder1]);
    expect(nextState.meta.total).toBe(2);
    expect(nextState.meta.page).toBe(1);
    expect(nextState.meta.hasNextPage).toBe(true);
    expect(nextState.isLoading).toBe(false);
  });

  it("handles fetchMoreOrders.fulfilled by appending subsequent pages", () => {
    const stateWithPage1 = {
      orders: [mockOrder1],
      selectedOrder: null,
      filters: { page: 1, limit: 1 },
      meta: {
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
    };

    const page2Payload = {
      orders: [mockOrder2],
      meta: {
        page: 2,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      },
    };

    const nextState = ordersReducer(
      stateWithPage1,
      fetchMoreOrders.fulfilled(page2Payload, "req-2", undefined),
    );

    expect(nextState.orders).toHaveLength(2);
    expect(nextState.orders).toEqual([mockOrder1, mockOrder2]);
    expect(nextState.meta.page).toBe(2);
    expect(nextState.meta.hasNextPage).toBe(false);
  });
});
