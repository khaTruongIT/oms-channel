/**
 * Reports & Analytics Page - Sprint 5.1 (S5.1.4, S5.1.5)
 * Real-time business intelligence with sales trends, channel breakdown,
 * inventory valuation, and top-selling SKUs.
 */

"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FeatureGate from "@/components/layout/FeatureGate";
import DateRangePicker from "@/components/reports/DateRangePicker";
import SalesChart from "@/components/charts/SalesChart";
import InventoryChart from "@/components/charts/InventoryChart";
import ChannelChart from "@/components/charts/ChannelChart";
import ExportButton from "@/components/ui/ExportButton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Download,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  useSalesReport,
  useInventoryValueReport,
  useTopSkusReport,
} from "@/hooks/useReports";

const CHANNEL_COLORS: Record<string, string> = {
  SHOPEE: "#EE4D2D",
  TIKTOK: "#0284C7",
  LAZADA: "#2563EB",
  MANUAL: "#10B981",
  RETAIL: "#059669",
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date()),
  });

  const fromIso = dateRange.start.toISOString();
  const toIso = dateRange.end.toISOString();

  // Real backend queries
  const { salesData, isLoading: isSalesLoading } = useSalesReport({
    from: fromIso,
    to: toIso,
    groupBy: "day",
  });

  const { salesData: channelSales, isLoading: isChannelLoading } =
    useSalesReport({
      from: fromIso,
      to: toIso,
      groupBy: "channel",
    });

  const {
    categories: inventoryCategories,
    summary: inventorySummary,
    isLoading: isInventoryLoading,
  } = useInventoryValueReport();

  const { topSkus, isLoading: isTopSkusLoading } = useTopSkusReport({
    from: fromIso,
    to: toIso,
    limit: 10,
  });

  // Calculate summary stats
  const totalRevenue = salesData.reduce(
    (sum, item) => sum + Number(item.sales || 0),
    0,
  );
  const totalOrders = salesData.reduce(
    (sum, item) => sum + Number(item.orders || 0),
    0,
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Format charts input
  const formattedSalesTrend = salesData.map((s) => ({
    date: s.period || "",
    sales: Number(s.sales || 0),
    orders: Number(s.orders || 0),
  }));

  const formattedChannels = channelSales.map((c) => ({
    name: c.channel || "Khác",
    value: Number(c.sales || 0),
    color: CHANNEL_COLORS[c.channel?.toUpperCase() || ""] || "#64748B",
  }));

  const formattedInventory = inventoryCategories.map((c) => ({
    category: c.category,
    available: c.available,
    reserved: c.reserved,
    lowStock: c.lowStock,
  }));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  // Export data
  const exportSummary = [
    {
      "Chỉ số": "Tổng doanh thu",
      "Giá trị": formatCurrency(totalRevenue),
    },
    {
      "Chỉ số": "Tổng đơn hàng",
      "Giá trị": totalOrders,
    },
    {
      "Chỉ số": "Giá trị đơn trung bình",
      "Giá trị": formatCurrency(avgOrderValue),
    },
    {
      "Chỉ số": "Tổng tồn kho (sản phẩm)",
      "Giá trị": inventorySummary.totalQuantity,
    },
    {
      "Chỉ số": "Tổng định giá tồn kho",
      "Giá trị": formatCurrency(inventorySummary.totalValuation),
    },
    {
      "Chỉ số": "SKU cảnh báo tồn thấp",
      "Giá trị": inventorySummary.lowStockCount,
    },
  ];

  return (
    <DashboardLayout>
      <FeatureGate feature="reports">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Báo cáo & Phân tích
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Số liệu kinh doanh tổng hợp tự động theo thời gian thực
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportButton
                data={exportSummary}
                filename={`bao-cao-kinh-doanh-${format(new Date(), "yyyyMMdd")}`}
                variant="primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </ExportButton>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Tổng doanh thu
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Tổng đơn hàng
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {totalOrders} <span className="text-sm font-normal text-slate-500">đơn</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Đơn trung bình (AOV)
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(avgOrderValue)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Định giá tồn kho
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(inventorySummary.totalValuation)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {inventorySummary.totalQuantity.toLocaleString()} sản phẩm tồn kho
                  </div>
                </div>
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
                  <Package className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  Xu hướng doanh thu & đơn hàng
                </h2>
              </div>
              <ErrorBoundary fallbackTitle="Lỗi tải biểu đồ doanh thu">
                {isSalesLoading ? (
                  <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
                    Đang tải dữ liệu doanh thu...
                  </div>
                ) : formattedSalesTrend.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <EmptyState
                      icon={<BarChart3 className="w-10 h-10 text-slate-300" />}
                      title="Chưa có dữ liệu doanh số"
                      description="Không phát sinh đơn hàng trong khoảng thời gian đã chọn."
                    />
                  </div>
                ) : (
                  <SalesChart data={formattedSalesTrend} />
                )}
              </ErrorBoundary>
            </div>

            {/* Channel Performance */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-slate-500" />
                  Tỷ trọng doanh thu theo kênh bán
                </h2>
              </div>
              <ErrorBoundary fallbackTitle="Lỗi tải biểu đồ kênh bán">
                {isChannelLoading ? (
                  <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
                    Đang tải dữ liệu kênh bán...
                  </div>
                ) : formattedChannels.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <EmptyState
                      icon={<PieChartIcon className="w-10 h-10 text-slate-300" />}
                      title="Chưa có doanh số kênh"
                      description="Chưa có đơn hàng phát sinh trên các kênh bán đã kết nối."
                    />
                  </div>
                ) : (
                  <ChannelChart data={formattedChannels} />
                )}
              </ErrorBoundary>
            </div>
          </div>

          {/* Inventory Distribution */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Phân bổ tồn kho theo danh mục
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi số lượng hàng khả dụng, đang giữ và cảnh báo tồn thấp
                </p>
              </div>
              {inventorySummary.lowStockCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {inventorySummary.lowStockCount} SKU cần nhập thêm
                </span>
              )}
            </div>
            <ErrorBoundary fallbackTitle="Lỗi tải biểu đồ tồn kho">
              {isInventoryLoading ? (
                <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
                  Đang tải dữ liệu tồn kho...
                </div>
              ) : formattedInventory.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <EmptyState
                    icon={<Package className="w-10 h-10 text-slate-300" />}
                    title="Chưa có dữ liệu phân loại tồn kho"
                    description="Tạo sản phẩm và liên kết danh mục để theo dõi tồn kho."
                  />
                </div>
              ) : (
                <InventoryChart data={formattedInventory} />
              )}
            </ErrorBoundary>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Top 10 sản phẩm bán chạy nhất
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xếp hạng theo doanh số và số lượng bán trong kỳ
                </p>
              </div>
            </div>
            <ErrorBoundary fallbackTitle="Lỗi tải danh sách sản phẩm bán chạy">
              {isTopSkusLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Đang tổng hợp danh sách bán chạy...
                </div>
              ) : topSkus.length === 0 ? (
                <div className="py-8 text-center">
                  <EmptyState
                    icon={<ShoppingCart className="w-10 h-10 text-slate-300" />}
                    title="Chưa có sản phẩm bán ra"
                    description="Các sản phẩm bán chạy sẽ xuất hiện khi có đơn hàng trong khoảng thời gian này."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Hạng</th>
                        <th className="px-4 py-3 text-left font-medium">Sản phẩm / SKU</th>
                        <th className="px-4 py-3 text-right font-medium">Số lượng bán</th>
                        <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topSkus.map((sku, idx) => (
                        <tr key={sku.masterSkuId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            #{idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{sku.productName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              SKU: {sku.sku}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {sku.unitsSold.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(sku.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
