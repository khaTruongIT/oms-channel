/**
 * Orders Redux Slice
 * Manages orders state
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ordersService } from "@services";
import { Order, OrderFilterParams, OrderStatus, ApiError } from "@types";
import type { UpdateOrderStatusDto } from "@services/orders.service";

interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilterParams;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  selectedOrder: null,
  filters: {},
  isLoading: false,
  isRefreshing: false,
  error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params: OrderFilterParams | undefined, { rejectWithValue }) => {
    try {
      const orders = await ordersService.getOrders(params);
      return orders;
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
      const orders = await ordersService.getOrders(params);
      return orders;
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
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
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
        // Update order in list
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        // Update selected order if it's the same
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
        state.orders = action.payload;
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
