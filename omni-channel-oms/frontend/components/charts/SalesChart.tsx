/**
 * SalesChart Component
 * Sales trend visualization using Recharts
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SalesChartProps {
  data: {
    date: string;
    sales: number;
    orders: number;
  }[];
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
          <Tooltip
            formatter={(value: any, name: any) => [
              name === "Doanh thu (₫)"
                ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(value || 0))
                : value,
              name,
            ]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#0369A1"
            strokeWidth={2}
            dot={{ fill: "#0369A1", r: 4 }}
            activeDot={{ r: 6 }}
            name="Doanh thu (₫)"
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 6 }}
            name="Đơn hàng"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
