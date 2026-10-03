"use client";

import useSWR from "swr";
import api from "@/lib/api";

export interface ChannelMapping {
  id: string;
  masterSkuId: string;
  channelAccountId?: string | null;
  channel: string;
  externalItemId: string;
  externalVariantId?: string;
  product?: {
    sku: string;
    name: string;
  };
  createdAt: string;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export interface ChannelMappingFilters {
  channel?: string;
  channelAccountId?: string;
}

export type CreateChannelMappingInput = {
  masterSkuId: string;
  channelAccountId?: string;
  channel: string;
  externalItemId: string;
  externalVariantId?: string;
};

function buildMappingsUrl(filters?: ChannelMappingFilters): string {
  const params = new URLSearchParams();
  if (filters?.channel) {
    params.set("channel", filters.channel);
  }
  if (filters?.channelAccountId) {
    params.set("channelAccountId", filters.channelAccountId);
  }
  const query = params.toString();
  return query ? `/channel-mappings?${query}` : "/channel-mappings";
}

export function useChannelMappings(filters?: ChannelMappingFilters) {
  const { data, error, isLoading, mutate } = useSWR<ChannelMapping[]>(
    buildMappingsUrl(filters),
    fetcher,
  );

  return {
    mappings: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createChannelMapping(data: CreateChannelMappingInput) {
  const response = await api.post<ChannelMapping>("/channel-mappings", data);
  return response.data;
}

export async function deleteChannelMapping(id: string) {
  await api.delete(`/channel-mappings/${id}`);
}
