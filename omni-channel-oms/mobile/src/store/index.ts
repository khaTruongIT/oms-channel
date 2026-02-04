/**
 * Redux Store Configuration
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import ordersReducer from "./slices/ordersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["auth/login/fulfilled", "auth/register/fulfilled"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
