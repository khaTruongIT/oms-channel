"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Order } from "@/types/orders";
import PackingSlip from "@/components/print/PackingSlip";
import Button from "@/components/ui/Button";
import { Printer, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import "@/styles/print.css";

const MAX_BULK_PRINT = 50;
const RENDER_CHUNK_SIZE = 5;

export default function BulkPrintPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawIds = searchParams.get("ids") || "";

  const orderIds = useMemo(
    () => rawIds.split(",").map((s) => s.trim()).filter(Boolean),
    [rawIds],
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progressive chunked rendering to prevent main thread blocking
  const [renderedCount, setRenderedCount] = useState<number>(0);

  useEffect(() => {
    if (orderIds.length === 0) {
      setError("No orders specified for printing.");
      setIsLoading(false);
      return;
    }

    if (orderIds.length > MAX_BULK_PRINT) {
      setError(
        `Maximum ${MAX_BULK_PRINT} orders allowed for bulk printing. You selected ${orderIds.length} orders. Please select fewer orders.`,
      );
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Fetch orders in parallel
    Promise.all(
      orderIds.map((id) =>
        api
          .get<Order>(`/orders/${id}`)
          .then((res) => res.data)
          .catch((err) => {
            console.error(`Failed to fetch order ${id}:`, err);
            return null;
          }),
      ),
    )
      .then((results) => {
        if (!isMounted) return;
        const validOrders = results.filter((o): o is Order => o !== null);
        if (validOrders.length === 0) {
          setError("Failed to load any of the selected orders.");
        } else {
          setOrders(validOrders);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "An unexpected error occurred while loading orders.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderIds]);

  // Progressive rendering in chunks using requestAnimationFrame
  useEffect(() => {
    if (orders.length === 0 || isLoading) return;

    if (renderedCount < orders.length) {
      const frame = requestAnimationFrame(() => {
        setRenderedCount((prev) =>
          Math.min(orders.length, prev + RENDER_CHUNK_SIZE),
        );
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [orders.length, isLoading, renderedCount]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-body text-sm">
          Loading {orderIds.length} orders for packing slips...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-danger">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-heading">Printing Error</h2>
        <p className="text-body max-w-md text-sm">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/orders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const isRenderingComplete = renderedCount >= orders.length;
  const visibleOrders = orders.slice(0, renderedCount);

  return (
    <>
      {/* Top Floating Action Bar (Hidden in print) */}
      <div className="print-button no-print bg-white/95 backdrop-blur-md border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
        <Button variant="secondary" onClick={() => router.push("/orders")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>

        <div className="text-xs text-body font-medium px-2">
          {isRenderingComplete ? (
            <span className="text-emerald-700">
              Ready: {orders.length} packing slip{orders.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span>
              Rendering: {renderedCount} / {orders.length}...
            </span>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handlePrint}
          disabled={!isRenderingComplete}
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print All ({orders.length})
        </Button>
      </div>

      {/* Rendered Packing Slips */}
      <div className="bulk-print-wrapper">
        {visibleOrders.map((order, idx) => (
          <div
            key={order.id}
            className={idx < visibleOrders.length - 1 ? "print-page-break mb-12" : ""}
          >
            <PackingSlip order={order} />
          </div>
        ))}
      </div>
    </>
  );
}
