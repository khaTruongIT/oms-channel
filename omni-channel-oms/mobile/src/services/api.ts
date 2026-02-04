/**
 * API Client Configuration
 * Axios instance with interceptors for JWT token injection
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "@types";

// API Base URL from environment
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "@oms_access_token",
  USER: "@oms_user",
  SELECTED_TENANT: "@oms_selected_tenant",
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (__DEV__) {
        console.log(
          `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
          {
            params: config.params,
            data: config.data,
          },
        );
      }

      return config;
    } catch (error) {
      console.error("[API Request Error]", error);
      return config;
    }
  },
  (error) => {
    console.error("[API Request Interceptor Error]", error);
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        },
      );
    }

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Log error in development
    if (__DEV__) {
      console.error("[API Error]", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear stored token and user data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.SELECTED_TENANT,
      ]);

      // TODO: Navigate to login screen
      // This will be handled by Redux store listener
    }

    // Return formatted error
    const apiError: ApiError = {
      message:
        error.response?.data?.message || error.message || "An error occurred",
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error,
    };

    return Promise.reject(apiError);
  },
);

export default apiClient;
