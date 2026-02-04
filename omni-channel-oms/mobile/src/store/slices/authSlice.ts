/**
 * Auth Redux Slice
 * Manages authentication state
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authService } from "@services";
import { User, UserTenantRole, Tenant, ApiError } from "@types";
import type { LoginDto, RegisterDto } from "@services/auth.service";

interface AuthState {
  user: User | null;
  tenantRoles: UserTenantRole[];
  selectedTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  tenantRoles: [],
  selectedTenant: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginDto, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: RegisterDto, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const loadStoredAuth = createAsyncThunk(
  "auth/loadStored",
  async (_, { rejectWithValue }) => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        return null;
      }

      const user = await authService.getStoredUser();
      // TODO: Load tenant roles from storage
      return { user, tenantRoles: [] };
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  },
);

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSelectedTenant: (state, action: PayloadAction<Tenant>) => {
      state.selectedTenant = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tenantRoles = action.payload.tenantRoles;
        state.selectedTenant = action.payload.tenantRoles[0]?.tenant || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tenantRoles = action.payload.tenantRoles;
        state.selectedTenant = action.payload.tenantRoles[0]?.tenant || null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.tenantRoles = action.payload.tenantRoles;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.tenantRoles = [];
      state.selectedTenant = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { setSelectedTenant, clearError } = authSlice.actions;
export default authSlice.reducer;
