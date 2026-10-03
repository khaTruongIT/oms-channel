"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  loading?: boolean;
  iconColor?: "primary" | "success" | "info" | "warning" | "danger";
}

export default function KPICard({
  title,
  value,
  change,
  icon,
  loading,
  iconColor = "primary",
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  const iconColorStyles = {
    primary: "bg-gradient-primary",
    success: "bg-gradient-success",
    info: "bg-gradient-info",
    warning: "bg-gradient-warning",
    danger: "bg-gradient-danger",
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-body mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-secondary-100 animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold text-heading">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div
              className={`flex items-center mt-2 text-sm font-medium ${
                isPositive ? "text-success" : "text-danger"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-body font-normal ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-md ${iconColorStyles[iconColor]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
