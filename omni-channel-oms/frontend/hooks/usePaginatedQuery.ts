"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type SWRConfiguration } from "swr";
import api from "../lib/api";
import { useTenantScopedSWR } from "./useTenantScopedSWR";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface UsePaginatedQueryOptions<TFilters extends Record<string, any>> {
  endpoint: string;
  defaultPage?: number;
  defaultLimit?: number;
  defaultFilters?: TFilters;
  syncWithUrl?: boolean;
  swrConfig?: SWRConfiguration;
  fetcher?: (url: string) => Promise<any>;
}

export interface UsePaginatedQueryResult<T, TFilters> {
  data: any;
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  filters: TFilters;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (
    updater: TFilters | ((prev: TFilters) => TFilters),
  ) => void;
  resetFilters: () => void;
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  mutate: () => Promise<any>;
}

export function buildPaginationQueryString(
  endpoint: string,
  options: {
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
  },
): string {
  const [base, existingQuery] = endpoint.split("?");
  const params = new URLSearchParams(existingQuery || "");

  if (options.page !== undefined && options.page !== null) {
    params.set("page", String(options.page));
  }
  if (options.limit !== undefined && options.limit !== null) {
    params.set("limit", String(options.limit));
  }

  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "ALL"
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
  }

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export function parsePaginationParams<TFilters extends Record<string, any>>(
  searchParams: { get: (key: string) => string | null } | null,
  defaults: {
    defaultPage?: number;
    defaultLimit?: number;
    defaultFilters?: TFilters;
  },
): { page: number; limit: number; filters: TFilters } {
  const defaultPage = defaults.defaultPage ?? 1;
  const defaultLimit = defaults.defaultLimit ?? 10;
  const defaultFilters = defaults.defaultFilters ?? ({} as TFilters);

  if (!searchParams) {
    return {
      page: defaultPage,
      limit: defaultLimit,
      filters: { ...defaultFilters },
    };
  }

  const rawPage = parseInt(searchParams.get("page") || "", 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : defaultPage;

  const rawLimit = parseInt(searchParams.get("limit") || "", 10);
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;

  const filters: Record<string, any> = { ...defaultFilters };
  for (const key of Object.keys(defaultFilters)) {
    const val = searchParams.get(key);
    if (val !== null && val !== "") {
      filters[key] = val;
    }
  }

  return {
    page,
    limit,
    filters: filters as TFilters,
  };
}

export function extractPaginatedResponse<T>(
  data: any,
  page: number,
  limit: number,
): { items: T[]; total: number; totalPages: number } {
  if (!data) {
    return { items: [], total: 0, totalPages: 1 };
  }

  // Case 1: Standard enveloped response { data: T[], meta: { total, ... } }
  if (data && Array.isArray(data.data) && data.meta) {
    const total = typeof data.meta.total === "number" ? data.meta.total : data.data.length;
    const totalPages =
      typeof data.meta.totalPages === "number"
        ? data.meta.totalPages
        : Math.ceil(total / (limit || 1)) || 1;
    return {
      items: data.data,
      total,
      totalPages,
    };
  }

  // Case 2: Legacy raw array response [ ... ]
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      totalPages: Math.ceil(data.length / (limit || 1)) || 1,
    };
  }

  // Fallback
  return { items: [], total: 0, totalPages: 1 };
}

const defaultApiFetcher = (url: string) => api.get(url).then((res) => res.data);

export function usePaginatedQuery<
  T = any,
  TFilters extends Record<string, any> = Record<string, any>,
>(options: UsePaginatedQueryOptions<TFilters>): UsePaginatedQueryResult<T, TFilters> {
  const {
    endpoint,
    defaultPage = 1,
    defaultLimit = 10,
    defaultFilters = {} as TFilters,
    syncWithUrl = true,
    swrConfig,
    fetcher = defaultApiFetcher,
  } = options;

  let router: ReturnType<typeof useRouter> | null = null;
  let pathname = "";
  let searchParams: ReturnType<typeof useSearchParams> | null = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname() || "";
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchParams = useSearchParams();
  } catch {
    // Graceful fallback in non-Next environment (e.g., pure unit tests)
  }

  const initialParsed = useMemo(
    () =>
      syncWithUrl && searchParams
        ? parsePaginationParams(searchParams, {
            defaultPage,
            defaultLimit,
            defaultFilters,
          })
        : {
            page: defaultPage,
            limit: defaultLimit,
            filters: defaultFilters,
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [page, setPageState] = useState<number>(initialParsed.page);
  const [limit, setLimitState] = useState<number>(initialParsed.limit);
  const [filters, setFiltersState] = useState<TFilters>(initialParsed.filters);

  // Sync state to URL
  const syncToUrl = useCallback(
    (nextPage: number, nextLimit: number, nextFilters: TFilters) => {
      if (!syncWithUrl || !router) return;

      const queryString = buildPaginationQueryString("", {
        page: nextPage,
        limit: nextLimit,
        filters: nextFilters,
      });

      const url = queryString ? `${pathname}${queryString}` : pathname;
      router.replace(url, { scroll: false });
    },
    [pathname, router, syncWithUrl],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      setPageState(nextPage);
      syncToUrl(nextPage, limit, filters);
    },
    [filters, limit, syncToUrl],
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      setLimitState(nextLimit);
      setPageState(1);
      syncToUrl(1, nextLimit, filters);
    },
    [filters, syncToUrl],
  );

  const setFilters = useCallback(
    (updater: TFilters | ((prev: TFilters) => TFilters)) => {
      setFiltersState((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        setPageState(1);
        syncToUrl(1, limit, next);
        return next;
      });
    },
    [limit, syncToUrl],
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPageState(1);
    syncToUrl(1, limit, defaultFilters);
  }, [defaultFilters, limit, syncToUrl]);

  // Construct tenant-scoped resource path
  const resourceUrl = useMemo(
    () =>
      buildPaginationQueryString(endpoint, {
        page,
        limit,
        filters,
      }),
    [endpoint, filters, limit, page],
  );

  const { data, error, isLoading, isValidating, mutate } = useTenantScopedSWR(
    resourceUrl,
    fetcher,
    swrConfig,
  );

  const { items, total, totalPages } = useMemo(
    () => extractPaginatedResponse<T>(data, page, limit),
    [data, limit, page],
  );

  return {
    data,
    items,
    total,
    totalPages,
    page,
    limit,
    filters,
    setPage,
    setLimit,
    setFilters,
    resetFilters,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
