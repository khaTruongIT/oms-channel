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
import { createOrder } from "@/hooks/useOrders";
import { Trash2 } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useChannelAccounts } from "@/hooks/useChannelAccounts";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ChannelProvider } from "@/types/orders";

const orderSchema = z.object({
  channel: z.string().min(1, "Channel is required"),
  externalOrderId: z.string().min(1, "External Order ID is required"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  channelAccountId: z.string().optional(),
  warehouseId: z.string().min(1, "Warehouse is required"),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderItem {
  masterSkuId: string;
  quantity: number;
  unitPrice: number;
}

type OrderItemFieldValue = string | number;

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { accounts } = useChannelAccounts();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      channel: "manual",
      channelAccountId: "",
      warehouseId: "",
    },
  });

  const addItem = (): void => {
    if (products.length > 0) {
      setItems([
        ...items,
        {
          masterSkuId: products[0].id,
          quantity: 1,
          unitPrice: products[0].costPrice ?? 0,
        },
      ]);
    }
  };

  const removeItem = (index: number): void => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof OrderItem,
    value: OrderItemFieldValue,
  ): void => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-update price when product changes
    if (field === "masterSkuId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].unitPrice = product.costPrice ?? 0;
      }
    }

    setItems(newItems);
  };

  const onSubmit = async (data: OrderFormData): Promise<void> => {
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsLoading(true);
    try {
      await createOrder({
        ...data,
        channel: data.channel as ChannelProvider,
        channelAccountId: data.channelAccountId || undefined,
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
        items,
      });
      toast.success("Order created successfully!");
      reset();
      setItems([]);
      onClose();
      onSuccess();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to create order"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Order" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
              {...register("channel")}
            >
              <option value="">Select Channel</option>
              <option value="manual">Manual</option>
              <option value="shopee">Shopee</option>
              <option value="tiktok">TikTok Shop</option>
              <option value="lazada">Lazada</option>
            </select>
            {errors.channel && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.channel.message}
              </p>
            )}
          </div>

          <Input
            label="External Order ID"
            placeholder="EXT-12345"
            error={errors.externalOrderId?.message}
            {...register("externalOrderId")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Account
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
              {...register("channelAccountId")}
            >
              <option value="">No connected account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.shopName ?? account.shopId ?? account.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
              {...register("warehouseId")}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {errors.warehouseId && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.warehouseId.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            placeholder="John Doe"
            error={errors.customerName?.message}
            {...register("customerName")}
          />

          <Input
            label="Customer Phone"
            placeholder="+1234567890"
            error={errors.customerPhone?.message}
            {...register("customerPhone")}
          />
        </div>

        {/* Order Items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Order Items
            </label>
            <Button type="button" size="sm" onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <select
                    value={item.masterSkuId}
                    onChange={(e) =>
                      updateItem(index, "masterSkuId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.skuCode} - {product.productName}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", parseInt(e.target.value) || 1)
                  }
                  min="1"
                  placeholder="Qty"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />

                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "unitPrice",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {items.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No items added yet
              </p>
            )}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-heading font-bold text-gray-900">
                  $
                  {items
                    .reduce(
                      (sum, item) => sum + item.quantity * item.unitPrice,
                      0,
                    )
                    .toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
