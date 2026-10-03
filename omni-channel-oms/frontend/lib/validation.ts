/**
 * Validation Utilities
 * Form validation schemas using Zod
 */

import { z } from "zod";

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name too long"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  price: z.number().min(0, "Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

// Order validation schema
export const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address").optional(),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Price must be positive"),
      }),
    )
    .min(1, "At least one item is required"),
});

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Warehouse validation schema
export const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().min(1, "Location is required"),
  capacity: z.number().min(0, "Capacity must be positive").optional(),
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name too long"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

// Generic validation helper
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validated = schema.parse(data);
    return { success: true as const, data: validated, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.reduce(
        (acc: Record<string, string>, err: z.ZodIssue) => {
          const path = err.path.join(".");
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>,
      );
      return { success: false as const, data: null, errors };
    }
    return {
      success: false as const,
      data: null,
      errors: { _form: "Validation failed" },
    };
  }
}

export type ProductFormData = z.infer<typeof productSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type WarehouseFormData = z.infer<typeof warehouseSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
