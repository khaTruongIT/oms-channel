"use client";

import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

type CellRenderer<T extends object> = {
  bivarianceHack(value: unknown, row: T): ReactNode;
}["bivarianceHack"];

export interface Column<T extends object = object> {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  render?: CellRenderer<T>;
}

interface TableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  getRowId?: (row: T, index: number) => string;
}

function getCellValue<T extends object>(row: T, key: string): unknown {
  return key in row ? row[key as keyof T] : undefined;
}

export default function Table<T extends object>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  isLoading,
  onRowClick,
  emptyMessage = "No data available",
  getRowId,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                  column.sortable ? "cursor-pointer hover:text-gray-700" : ""
                }`}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    <span className="text-primary">
                      {sortDirection === "asc" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-body"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-body"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={getRowId?.(row, idx) ?? idx}
                className={`hover:bg-secondary-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-heading"
                  >
                    {column.render
                      ? column.render(getCellValue(row, column.key), row)
                      : String(getCellValue(row, column.key) ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
