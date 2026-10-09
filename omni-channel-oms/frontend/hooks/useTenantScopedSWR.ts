"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { tenantScopedKey, type TenantScopedKey } from "@/lib/tenant-cache";
import { useCurrentTenantId } from "./useTenants";

type TenantScopedFetcher<Data> = (resource: string) => Promise<Data>;

export function useTenantScopedSWR<Data>(
  resource: string | null,
  fetcher: TenantScopedFetcher<Data>,
  configuration?: SWRConfiguration<Data>,
) {
  const tenantId = useCurrentTenantId();
  const key = tenantScopedKey(tenantId, resource);

  return useSWR<Data, Error, TenantScopedKey | null>(
    key,
    ([, url]) => fetcher(url),
    configuration,
  );
}
