"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Product, CreateProductDto, ProductVariant } from "@/hooks/useProducts";
import { Plus, Trash2 } from "lucide-react";

const productSchema = z.object({
  skuCode: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .regex(/^[A-Z0-9-]+$/, "SKU must be uppercase alphanumeric with hyphens"),
  productName: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(255, "Product name too long"),
  costPrice: z
    .number()
    .min(0, "Cost price must be positive")
    .optional()
    .or(z.literal(undefined)),
  categoryId: z
    .string()
    .uuid("Invalid category ID")
    .optional()
    .or(z.literal("")),
  categoryName: z.string().optional(),
  variants: z
    .array(
      z.object({
        size: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDto) => Promise<void>;
  product?: Product;
}

export default function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  product,
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          skuCode: product.skuCode,
          productName: product.productName,
          costPrice: product.costPrice || undefined,
          categoryId: product.categoryId || "",
          categoryName: product.categoryName || "",
          variants: product.variants || [],
        }
      : {
          skuCode: "",
          productName: "",
          costPrice: undefined,
          categoryId: "",
          categoryName: "",
          variants: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      // Clean up data before submission
      const submitData: CreateProductDto = {
        skuCode: data.skuCode,
        productName: data.productName,
      };

      // Only include skuCode for create, not update
      if (product) {
        // For update: exclude skuCode (backend rejects it)
        delete (submitData as any).skuCode;
      }

      if (data.costPrice !== undefined && data.costPrice > 0) {
        submitData.costPrice = data.costPrice;
      }

      if (data.categoryId && data.categoryId.trim() !== "") {
        submitData.categoryId = data.categoryId;
      }

      if (data.categoryName && data.categoryName.trim() !== "") {
        submitData.categoryName = data.categoryName;
      }

      if (data.variants && data.variants.length > 0) {
        // Filter out empty variants
        const validVariants = data.variants.filter((v) => v.size || v.color);
        if (validVariants.length > 0) {
          submitData.variants = validVariants;
        }
      }

      await onSubmit(submitData);
      toast.success(product ? "Product updated!" : "Product created!");
      reset();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Operation failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Pre-fill form when editing a product
  useEffect(() => {
    if (isOpen && product) {
      reset({
        skuCode: product.skuCode,
        productName: product.productName,
        costPrice: product.costPrice || undefined,
        categoryId: product.categoryId || "",
        categoryName: product.categoryName || "",
        variants: product.variants || [],
      });
    } else if (isOpen && !product) {
      reset({
        skuCode: "",
        productName: "",
        costPrice: undefined,
        categoryId: "",
        categoryName: "",
        variants: [],
      });
    }
  }, [isOpen, product, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "Edit Product" : "Create Product"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* SKU Code - Required */}
        <Input
          label="SKU Code"
          placeholder="PROD-001"
          error={errors.skuCode?.message}
          required
          disabled={!!product}
          {...register("skuCode")}
        />

        {/* Product Name - Required */}
        <Input
          label="Product Name"
          placeholder="Premium T-Shirt"
          error={errors.productName?.message}
          required
          {...register("productName")}
        />

        {/* Cost Price - Optional */}
        <Input
          label="Cost Price"
          type="number"
          step="0.01"
          placeholder="29.99"
          error={errors.costPrice?.message}
          {...register("costPrice", {
            setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
          })}
        />

        {/* Category Name - Optional */}
        <Input
          label="Category Name"
          placeholder="Electronics"
          error={errors.categoryName?.message}
          {...register("categoryName")}
        />

        {/* Category ID - Optional */}
        <Input
          label="Category ID (UUID)"
          placeholder="550e8400-e29b-41d4-a716-446655440000"
          error={errors.categoryId?.message}
          {...register("categoryId")}
        />

        {/* Variants Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-heading">
              Variants (Optional)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ size: "", color: "" })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Variant
            </Button>
          </div>

          {fields.length > 0 && (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start space-x-2 p-3 bg-surface rounded-lg border border-border"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Size (e.g., M, L, XL)"
                      {...register(`variants.${index}.size` as const)}
                    />
                    <Input
                      placeholder="Color (e.g., Blue, Red)"
                      {...register(`variants.${index}.color` as const)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="mt-1"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {fields.length === 0 && (
            <p className="text-sm text-body italic">
              No variants added. Click "Add Variant" to create product
              variations.
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
