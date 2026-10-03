/**
 * InventoryChart Component
 * Inventory distribution visualization
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface InventoryChartProps {
  data: {
    category: string;
    available: number;
    reserved: number;
    lowStock: number;
  }[];
}

const COLORS = {
  available: "#10b981",
  reserved: "#f59e0b",
  lowStock: "#ef4444",
};

export default function InventoryChart({ data }: InventoryChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="category"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
          />
          <Legend />
          <Bar
            dataKey="available"
            fill={COLORS.available}
            radius={[4, 4, 0, 0]}
            name="Available"
          />
          <Bar
            dataKey="reserved"
            fill={COLORS.reserved}
            radius={[4, 4, 0, 0]}
            name="Reserved"
          />
          <Bar
            dataKey="lowStock"
            fill={COLORS.lowStock}
            radius={[4, 4, 0, 0]}
            name="Low Stock"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
