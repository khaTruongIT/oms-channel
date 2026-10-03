/**
 * Print Page for Orders
 * Allows printing invoice or packing slip
 */

"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useOrder } from "@/hooks/useOrders";
import Invoice from "@/components/print/Invoice";
import PackingSlip from "@/components/print/PackingSlip";
import Button from "@/components/ui/Button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import "@/styles/print.css";

export default function OrderPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const type = searchParams.get("type") || "invoice"; // invoice or packing-slip

  const { order, isLoading } = useOrder(orderId);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Order not found
        </h2>
        <Link href="/orders">
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Print Button (hidden in print) */}
      <div className="print-button no-print">
        <div className="flex gap-2">
          <Link href={`/orders/${orderId}`}>
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Content */}
      {type === "invoice" ? (
        <Invoice order={order} />
      ) : (
        <PackingSlip order={order} />
      )}
    </>
  );
}
