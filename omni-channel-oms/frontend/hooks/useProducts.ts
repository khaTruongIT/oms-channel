"use client";

import useSWR from "swr";
import api from "@/lib/api";

export interface ProductVariant {
  size?: string;
  color?: string;
  [key: string]: any; // Allow additional variant properties
}

export interface Product {
  id: string;
  skuCode: string;
  productName: string;
  variants: ProductVariant[];
  costPrice: number;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  skuCode: string;
  productName: string;
  variants?: ProductVariant[];
  costPrice?: number;
  categoryId?: string;
  categoryName?: string;
}

export interface UpdateProductDto {
  productName?: string;
  variants?: ProductVariant[];
  costPrice?: number;
  categoryId?: string;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    "/products",
    fetcher,
  );

  return {
    products: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProduct(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    id ? `/products/${id}` : null,
    fetcher,
  );

  return {
    product: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function createProduct(productData: CreateProductDto) {
  const { data } = await api.post("/products", productData);
  return data;
}

export async function updateProduct(id: string, productData: UpdateProductDto) {
  const { data } = await api.put(`/products/${id}`, productData);
  return data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}
