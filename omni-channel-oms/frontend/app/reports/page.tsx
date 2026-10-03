/**
 * Reports & Analytics Page
 * Comprehensive analytics dashboard with sales, inventory, and channel reports
 */

"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DateRangePicker from "@/components/reports/DateRangePicker";
import SalesChart from "@/components/charts/SalesChart";
import InventoryChart from "@/components/charts/InventoryChart";
import ChannelChart from "@/components/charts/ChannelChart";
import ExportButton from "@/components/ui/ExportButton";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Download,
} from "lucide-react";
import { subDays } from "date-fns";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  // Mock data - TODO: Fetch from API based on date range
  const salesData = [
    { date: "Week 1", sales: 12400, orders: 68 },
    { date: "Week 2", sales: 15800, orders: 82 },
    { date: "Week 3", sales: 13200, orders: 71 },
    { date: "Week 4", sales: 18500, orders: 95 },
  ];

  const inventoryData = [
    { category: "Electronics", available: 450, reserved: 120, lowStock: 15 },
    { category: "Clothing", available: 680, reserved: 200, lowStock: 8 },
    { category: "Home & Garden", available: 320, reserved: 80, lowStock: 12 },
    { category: "Sports", available: 210, reserved: 50, lowStock: 5 },
  ];

  const channelData = [
    { name: "Website", value: 18500, color: "#8b5cf6" },
    { name: "Amazon", value: 12300, color: "#10b981" },
    { name: "eBay", value: 8900, color: "#f59e0b" },
    { name: "Shopify", value: 5500, color: "#3b82f6" },
  ];

  // Summary stats
  const totalRevenue = salesData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;
  const totalProducts = inventoryData.reduce(
    (sum, item) => sum + item.available + item.reserved,
    0,
  );

  // Export data
  const exportData = {
    summary: [
      { Metric: "Total Revenue", Value: `$${totalRevenue.toLocaleString()}` },
      { Metric: "Total Orders", Value: totalOrders },
      { Metric: "Avg Order Value", Value: `$${avgOrderValue.toFixed(2)}` },
      { Metric: "Total Products", Value: totalProducts },
    ],
    sales: salesData,
    inventory: inventoryData,
    channels: channelData,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">
              Reports & Analytics
            </h1>
            <p className="text-body mt-1">
              Comprehensive business insights and metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButton
              data={exportData.summary}
              filename="analytics-report"
              variant="primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </ExportButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12.5%
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalOrders}
                </div>
                <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8.3%
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Avg Order Value
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${avgOrderValue.toFixed(2)}
                </div>
                <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +4.1%
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Products</div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalProducts}
                </div>
                <div className="text-sm text-gray-500 mt-1">In stock</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sales Trend
            </h2>
            <SalesChart data={salesData} />
          </div>

          {/* Channel Performance */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Channel Performance
            </h2>
            <ChannelChart data={channelData} />
          </div>
        </div>

        {/* Inventory Distribution */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Distribution by Category
          </h2>
          <InventoryChart data={inventoryData} />
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Selling Products
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Units Sold
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">Product A</td>
                  <td className="px-4 py-3 text-right text-gray-900">245</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    $12,250
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">+15%</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">Product B</td>
                  <td className="px-4 py-3 text-right text-gray-900">198</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    $9,900
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">+8%</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">Product C</td>
                  <td className="px-4 py-3 text-right text-gray-900">156</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    $7,800
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">-3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
