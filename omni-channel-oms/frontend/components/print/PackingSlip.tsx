/**
 * PackingSlip Print Component
 * Print-optimized packing slip template
 */

"use client";

import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { Package } from "lucide-react";

interface PackingSlipProps {
  order: Order;
}

export default function PackingSlip({ order }: PackingSlipProps) {
  return (
    <div className="print-container p-8 max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="packing-slip-header print-no-break">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Package className="w-12 h-12 text-gray-900" />
          <h1 className="text-4xl font-bold text-gray-900">PACKING SLIP</h1>
        </div>
        <p className="text-gray-600 text-lg">Order #{order.orderNumber}</p>
        <p className="text-gray-600">
          {format(new Date(order.createdAt), "MMMM dd, yyyy")}
        </p>
      </div>

      {/* Barcode/QR Code Area */}
      <div className="packing-slip-barcode print-no-break">
        <div className="border-2 border-gray-300 rounded-lg p-6 inline-block">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold mb-2">
              *{order.orderNumber}*
            </div>
            <p className="text-sm text-gray-600">Scan to track</p>
          </div>
        </div>
      </div>

      {/* Ship To */}
      <div className="print-no-break mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">SHIP TO:</h2>
        <div className="text-lg">
          <p className="font-bold text-gray-900 mb-2">{order.customerName}</p>
          {order.customerPhone && (
            <p className="text-gray-700 mb-1">Phone: {order.customerPhone}</p>
          )}
          {order.shippingAddress && (
            <p className="text-gray-700 whitespace-pre-line">
              {order.shippingAddress}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ITEMS TO PACK ({order.items?.length || 0})
        </h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left py-3 px-4">Item</th>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-center py-3 px-4">Quantity</th>
              <th className="text-center py-3 px-4">Packed</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="py-4 px-4 font-medium">
                  {item.product?.name || "Unknown Product"}
                </td>
                <td className="py-4 px-4 text-gray-600 font-mono">
                  {item.product?.sku || item.masterSkuId}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-block bg-gray-200 px-4 py-2 rounded-full font-bold text-lg">
                    {item.quantity}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-gray-400 rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Instructions */}
      <div className="print-no-break mt-8 border-2 border-dashed border-gray-300 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          SPECIAL INSTRUCTIONS
        </h3>
        <p className="text-gray-600">
          Please ensure all items are checked and packed securely.
        </p>
        <p className="text-gray-600 mt-2">
          Channel:{" "}
          <span className="font-medium capitalize">{order.channel}</span>
        </p>
      </div>

      {/* Signature */}
      <div className="print-no-break mt-12">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-gray-600 mb-2">Packed By:</p>
            <div className="signature-line"></div>
            <p className="text-sm text-gray-500 mt-2">Signature</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2">Date:</p>
            <div className="signature-line"></div>
            <p className="text-sm text-gray-500 mt-2">Date</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer mt-16 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>This is a packing slip, not an invoice.</p>
        <p className="mt-1">Keep this document with the shipment.</p>
      </div>
    </div>
  );
}
