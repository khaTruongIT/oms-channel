/**
 * Invoice Print Component
 * Print-optimized invoice template
 */

"use client";

import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import Image from "next/image";

interface InvoiceProps {
  order: Order;
  companyInfo?: CompanyInfo;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export default function Invoice({ order, companyInfo }: InvoiceProps) {
  const subtotal =
    order.items?.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    ) || 0;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const defaultCompany: CompanyInfo = {
    name: "Omni OMS",
    address: "123 Business St, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@omni-oms.com",
  };

  const company = companyInfo || defaultCompany;

  return (
    <div className="print-container p-8 max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="invoice-header print-no-break">
        <div>
          {company.logo && (
            <Image
              src={company.logo}
              alt={company.name}
              width={160}
              height={64}
              className="invoice-logo mb-4"
              unoptimized
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-600 text-sm">{company.address}</p>
          <p className="text-gray-600 text-sm">{company.phone}</p>
          <p className="text-gray-600 text-sm">{company.email}</p>
        </div>
        <div className="invoice-details">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
          <p className="text-gray-600">
            <strong>Invoice #:</strong> {order.orderNumber}
          </p>
          <p className="text-gray-600">
            <strong>Date:</strong>{" "}
            {format(new Date(order.createdAt), "MMMM dd, yyyy")}
          </p>
          <p className="text-gray-600">
            <strong>Status:</strong>{" "}
            <span className="uppercase">{order.status}</span>
          </p>
        </div>
      </div>

      {/* Bill To */}
      <div className="print-no-break mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
        <p className="text-gray-900 font-medium">{order.customerName}</p>
        {order.customerPhone && (
          <p className="text-gray-600">{order.customerPhone}</p>
        )}
        {order.shippingAddress && (
          <p className="text-gray-600">{order.shippingAddress}</p>
        )}
      </div>

      {/* Items Table */}
      <div className="invoice-items mt-8">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4">Item</th>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-right py-3 px-4">Qty</th>
              <th className="text-right py-3 px-4">Unit Price</th>
              <th className="text-right py-3 px-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">
                  {item.product?.name || "Unknown Product"}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {item.product?.sku ?? item.product?.skuCode ?? item.masterSkuId}
                </td>
                <td className="py-3 px-4 text-right">{item.quantity}</td>
                <td className="py-3 px-4 text-right">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="invoice-total mt-8 print-no-break">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax (10%):</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-900">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer mt-16 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>Thank you for your business!</p>
        <p className="mt-2">
          For questions about this invoice, please contact {company.email}
        </p>
      </div>
    </div>
  );
}
