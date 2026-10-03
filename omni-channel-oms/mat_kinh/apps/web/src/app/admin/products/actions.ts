"use server";

import { revalidatePath } from "next/cache";
import type { Product } from "@optiqis/shared";
import {
  adjustInventory,
  createProduct,
  deleteProduct,
  updateProduct,
  type AdjustInventoryInput,
  type AdminInventoryItem,
} from "@/lib/api";

export async function createProductAction(product: Omit<Product, "id">): Promise<Product> {
  const created = await createProduct(product);
  revalidatePath("/admin/products");
  revalidatePath("/san-pham");
  return created;
}

export async function updateProductAction(id: string, product: Partial<Product>): Promise<Product> {
  const updated = await updateProduct(id, product);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/san-pham");
  return updated;
}

export async function deleteProductAction(id: string): Promise<{ success: boolean }> {
  const result = await deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/san-pham");
  return result;
}

export async function adjustInventoryAction(input: AdjustInventoryInput): Promise<AdminInventoryItem> {
  const updated = await adjustInventory(input);
  revalidatePath(`/admin/products/${input.masterSkuId}/inventory`);
  return updated;
}
