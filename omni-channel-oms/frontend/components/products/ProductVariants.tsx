/**
 * ProductVariants Component
 * Product variants table with stock and pricing
 */

"use client";

import { Plus, Edit, Trash2 } from "lucide-react";
import Button from "../ui/Button";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { size: "M", color: "Blue" }
}

interface ProductVariantsProps {
  variants?: Variant[];
  onAdd?: () => void;
  onEdit?: (variant: Variant) => void;
  onDelete?: (variantId: string) => void;
}

export default function ProductVariants({
  variants = [],
  onAdd,
  onEdit,
  onDelete,
}: ProductVariantsProps) {
  if (variants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No variants configured</p>
        {onAdd && (
          <Button variant="secondary" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Variants ({variants.length})
        </h3>
        {onAdd && (
          <Button variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        )}
      </div>

      {/* Variants Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Variant
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variants.map((variant) => (
              <tr key={variant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {variant.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Object.entries(variant.attributes)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-gray-600">
                    {variant.sku}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-gray-900">
                    ${variant.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      variant.stock > 10
                        ? "bg-green-100 text-green-700"
                        : variant.stock > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {variant.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(variant)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Edit variant"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(variant.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Delete variant"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
