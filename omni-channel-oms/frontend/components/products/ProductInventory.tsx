/**
 * ProductInventory Component
 * Stock levels by warehouse
 */

"use client";

import { Warehouse, AlertTriangle, ArrowRightLeft } from "lucide-react";
import Button from "../ui/Button";

interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  available: number;
  reserved: number;
  total: number;
}

interface ProductInventoryProps {
  inventory?: WarehouseStock[];
  onTransfer?: (fromWarehouse: string, toWarehouse: string) => void;
}

export default function ProductInventory({
  inventory = [],
  onTransfer,
}: ProductInventoryProps) {
  const totalAvailable = inventory.reduce(
    (sum, item) => sum + item.available,
    0,
  );
  const totalReserved = inventory.reduce((sum, item) => sum + item.reserved, 0);
  const totalStock = inventory.reduce((sum, item) => sum + item.total, 0);

  if (inventory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Warehouse className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No inventory data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Total Stock</div>
          <div className="text-2xl font-bold text-gray-900">{totalStock}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 mb-1">Available</div>
          <div className="text-2xl font-bold text-green-700">
            {totalAvailable}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 mb-1">Reserved</div>
          <div className="text-2xl font-bold text-orange-700">
            {totalReserved}
          </div>
        </div>
      </div>

      {/* Warehouse Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Warehouse
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Available
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Reserved
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              {onTransfer && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventory.map((item) => (
              <tr key={item.warehouseId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {item.warehouseName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-green-600">
                    {item.available}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-orange-600">
                    {item.reserved}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-bold text-gray-900">
                      {item.total}
                    </span>
                    {item.available < 10 && (
                      <AlertTriangle
                        className="w-4 h-4 text-red-500"
                        aria-label="Low stock"
                      />
                    )}
                  </div>
                </td>
                {onTransfer && (
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onTransfer(item.warehouseId, "")}
                    >
                      <ArrowRightLeft className="w-3 h-3 mr-1" />
                      Transfer
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
