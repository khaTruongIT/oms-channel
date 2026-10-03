import useSWR from "swr";
import api from "@/lib/api";

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  address?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseData {
  name: string;
  location?: string;
  address?: string;
  isDefault?: boolean;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useWarehouses() {
  const { data, error, isLoading, mutate } = useSWR<Warehouse[]>(
    "/warehouses",
    fetcher,
  );

  return {
    warehouses: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useWarehouse(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Warehouse>(
    id ? `/warehouses/${id}` : null,
    fetcher,
  );

  return {
    warehouse: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createWarehouse(data: CreateWarehouseData) {
  const response = await api.post("/warehouses", data);
  return response.data;
}

export async function updateWarehouse(
  id: string,
  data: Partial<CreateWarehouseData>,
) {
  const response = await api.put(`/warehouses/${id}`, data);
  return response.data;
}

export async function deleteWarehouse(id: string) {
  const response = await api.delete(`/warehouses/${id}`);
  return response.data;
}
