import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface StoredTenant {
  id?: string;
}

function parseStoredTenant(value: string | null): StoredTenant | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as StoredTenant;
    }
  } catch {
    return null;
  }

  return null;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") {
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add current tenant context to headers
    const currentTenant = parseStoredTenant(localStorage.getItem("currentTenant"));
    if (currentTenant?.id) {
      config.headers["x-tenant-id"] = currentTenant.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // If 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window === "undefined") {
          throw new Error("Cannot refresh browser session on the server");
        }

        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/refresh`,
          { refresh_token: refreshToken },
        );

        // Store new access token
        localStorage.setItem("token", data.access_token);

        // Update authorization header
        api.defaults.headers.common["Authorization"] =
          `Bearer ${data.access_token}`;
        originalRequest.headers["Authorization"] = `Bearer ${data.access_token}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentTenant");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
