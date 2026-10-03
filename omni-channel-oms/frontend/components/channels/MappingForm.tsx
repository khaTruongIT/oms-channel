"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useProducts } from "@/hooks/useProducts";
import type { ChannelAccount } from "@/types/integration";
import type { CreateChannelMappingInput } from "@/hooks/useChannelMappings";
import { getApiErrorMessage } from "@/lib/api-error";

const channelMappingSchema = z.object({
  masterSkuId: z.string().min(1, "Product is required"),
  channelAccountId: z.string().min(1, "Channel account is required"),
  channel: z.string().min(1, "Channel is required"),
  externalItemId: z.string().min(1, "External Item ID is required"),
  externalVariantId: z.string().optional(),
});

type ChannelMappingFormData = z.infer<typeof channelMappingSchema>;

interface MappingFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ChannelAccount[];
  onSubmit: (data: CreateChannelMappingInput) => Promise<void>;
}

export default function MappingForm({
  isOpen,
  onClose,
  accounts,
  onSubmit,
}: MappingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { products } = useProducts();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChannelMappingFormData>({
    resolver: zodResolver(channelMappingSchema),
    defaultValues: {
      channel: "shopee",
    },
  });

  const handleFormSubmit = async (data: ChannelMappingFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success("Channel mapping created!");
      reset();
      onClose();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to create mapping"));
    } finally {
      setIsLoading(false);
    }
  };

  const shopeeAccounts = accounts.filter((account) => account.provider === "shopee");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel Mapping">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shopee account
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
            {...register("channelAccountId")}
          >
            <option value="">Select connected shop</option>
            {shopeeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.shopName ?? "Unnamed shop"} · {account.shopId ?? account.id}
              </option>
            ))}
          </select>
          {errors.channelAccountId && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.channelAccountId.message}
            </p>
          )}
          {shopeeAccounts.length === 0 && (
            <p className="mt-1.5 text-sm text-amber-700">
              Register a Shopee shop before creating SKU mappings.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
            {...register("masterSkuId")}
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.skuCode} - {product.productName}
              </option>
            ))}
          </select>
          {errors.masterSkuId && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.masterSkuId.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
            {...register("channel")}
          >
            <option value="shopee">Shopee</option>
          </select>
          {errors.channel && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.channel.message}
            </p>
          )}
        </div>

        <Input
          label="External Item ID"
          placeholder="12345678"
          error={errors.externalItemId?.message}
          {...register("externalItemId")}
        />

        <Input
          label="External Variant ID (Optional)"
          placeholder="VAR-123"
          error={errors.externalVariantId?.message}
          {...register("externalVariantId")}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Mapping
          </Button>
        </div>
      </form>
    </Modal>
  );
}
