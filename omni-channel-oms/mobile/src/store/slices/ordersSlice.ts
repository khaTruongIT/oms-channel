/**
 * Orders Redux Slice
 * Manages orders state with pagination support (S2.1.10)
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ordersService } from "@services";
import { Order, OrderFilterParams, OrderStatus, ApiError } from "@types";
import type {
  UpdateOrderStatusDto,
  OrdersPaginationMeta,
  PaginatedOrdersResult,
} from "@services/orders.service";

export interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilterParams;
  meta: OrdersPaginationMeta;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const initialMeta: OrdersPaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const initialState: OrdersState = {
  orders: [],
  selectedOrder: null,
  filters: { page: 1, limit: 20 },
  meta: initialMeta,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params: OrderFilterParams | undefined, { rejectWithValue }) => {
    try {
      const result = await ordersService.getOrders(params);
      return result;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const fetchMoreOrders = createAsyncThunk(
  "orders/fetchMoreOrders",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as { orders: OrdersState }).orders;
      if (!state.meta.hasNextPage || state.isLoadingMore || state.isLoading) {
        return null;
      }
      const nextPage = state.meta.page + 1;
      const result = await ordersService.getOrders({
        ...state.filters,
        page: nextPage,
        limit: state.meta.limit,
      });
      return result;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (id: string, { rejectWithValue }) => {
    try {
      const order = await ordersService.getOrderById(id);
      return order;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async (
    { id, data }: { id: string; data: UpdateOrderStatusDto },
    { rejectWithValue },
  ) => {
    try {
      const order = await ordersService.updateOrderStatus(id, data);
      return order;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const refreshOrders = createAsyncThunk(
  "orders/refreshOrders",
  async (params: OrderFilterParams | undefined, { rejectWithValue }) => {
    try {
      const result = await ordersService.getOrders({
        ...params,
        page: 1,
      });
      return result;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

// Slice
const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<OrderFilterParams>) => {
      state.filters = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.meta = action.payload.meta;
        state.filters.page = action.payload.meta.page;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch more orders (Pagination load more)
    builder
      .addCase(fetchMoreOrders.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreOrders.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        if (action.payload) {
          state.orders = [...state.orders, ...action.payload.orders];
          state.meta = action.payload.meta;
          state.filters.page = action.payload.meta.page;
        }
      })
      .addCase(fetchMoreOrders.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      });

    // Fetch order by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update order status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh orders
    builder
      .addCase(refreshOrders.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshOrders.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.orders = action.payload.orders;
        state.meta = action.payload.meta;
        state.filters.page = action.payload.meta.page;
      })
      .addCase(refreshOrders.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearSelectedOrder, clearError } =
  ordersSlice.actions;
export default ordersSlice.reducer;
