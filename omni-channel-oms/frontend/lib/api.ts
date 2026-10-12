import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface StoredTenant {
  id?: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const nullStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

let refreshPromise: Promise<string> | null = null;

export function clearRefreshPromise(): void {
  refreshPromise = null;
}

export async function singleFlightRefreshToken(
  storage: StorageLike = typeof window !== "undefined"
    ? window.localStorage
    : nullStorage,
  refreshApi: (
    url: string,
    body: { refresh_token: string },
  ) => Promise<{ data: { access_token: string } }> = axios.post,
): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = storage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const { data } = await refreshApi(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/refresh`,
      { refresh_token: refreshToken },
    );

    const newToken = data.access_token;
    storage.setItem("token", newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    return newToken;
  })()
    .catch((refreshError) => {
      storage.removeItem("token");
      storage.removeItem("refreshToken");
      storage.removeItem("currentTenant");
      if (
        typeof window !== "undefined" &&
        window.location?.pathname &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
      throw refreshError;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
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
    const currentTenant = parseStoredTenant(
      localStorage.getItem("currentTenant"),
    );
    if (currentTenant?.id) {
      config.headers["x-tenant-id"] = currentTenant.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for auto-refresh on 401 with single-flight locking
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // If 401 error and we haven't already tried to refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        if (typeof window === "undefined") {
          throw new Error("Cannot refresh browser session on the server");
        }

        const newAccessToken = await singleFlightRefreshToken();
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
