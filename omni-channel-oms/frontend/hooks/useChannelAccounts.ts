"use client";

import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";
import type { ChannelAccount, CreateShopeeAccountInput } from "@/types/integration";

export type {
  ChannelAccount,
  ChannelAccountStatus,
  CreateShopeeAccountInput,
} from "@/types/integration";

const fetcher = <T>(url: string): Promise<T> =>
  api.get<T>(url).then((response) => response.data);

export function useChannelAccounts() {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<ChannelAccount[]>(
    "/channel-accounts",
    fetcher,
  );

  return { accounts: data ?? [], error, isLoading, mutate };
}

export async function reconnectChannelAccount(id: string): Promise<void> {
  await api.post(`/channel-accounts/${id}/reconnect`);
}

export async function disconnectChannelAccount(id: string): Promise<void> {
  await api.delete(`/channel-accounts/${id}`);
}

export async function createShopeeAccount(
  input: CreateShopeeAccountInput,
): Promise<ChannelAccount> {
  const response = await api.post<ChannelAccount>("/channel-accounts/shopee", input);
  return response.data;
}
