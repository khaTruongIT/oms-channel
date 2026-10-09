import api from "@/lib/api";
import { useTenantScopedSWR } from "@/hooks/useTenantScopedSWR";

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useCategories() {
  const { data, error, isLoading, mutate } = useTenantScopedSWR<Category[]>(
    "/categories",
    fetcher,
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createCategory(data: CreateCategoryData) {
  const response = await api.post("/categories", data);
  return response.data;
}

export async function updateCategory(id: string, data: UpdateCategoryData) {
  const response = await api.patch(`/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: string) {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
}
