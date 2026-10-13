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
  /** Row density. Defaults to "comfortable". */
  density?: "comfortable" | "compact";
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
  density = "comfortable",
}: TableProps<T>) {
  const cellPadding = density === "compact" ? "px-4 py-2" : "px-6 py-4";
  const renderCell = (row: T, column: Column<T>) =>
    column.render
      ? column.render(getCellValue(row, column.key), row)
      : String(getCellValue(row, column.key) ?? "");

  if (isLoading || data.length === 0) {
    return (
      <div
        className="px-6 py-12 text-center text-body"
        role={isLoading ? "status" : undefined}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
            <span>Loading...</span>
          </div>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile (< md): card list, no horizontal scroll */}
      <ul className="divide-y divide-border md:hidden">
        {data.map((row, idx) => (
          <li
            key={getRowId?.(row, idx) ?? idx}
            className={`space-y-2 p-4 transition-colors duration-150 ${
              onRowClick
                ? "cursor-pointer hover:bg-secondary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                : ""
            }`}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => {
              if (onRowClick && e.key === "Enter") onRowClick(row);
            }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {column.label}
                </span>
                <span className="text-right text-heading">
                  {renderCell(row, column)}
                </span>
              </div>
            ))}
          </li>
        ))}
      </ul>

      {/* Desktop (>= md): table with sticky header */}
      <div className="hidden max-h-[70vh] overflow-auto md:block">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 bg-secondary-50">
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    column.sortable && sortKey === column.key
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`${cellPadding} text-left text-xs font-semibold text-muted uppercase tracking-wider ${
                    column.sortable
                      ? "cursor-pointer transition-colors duration-150 hover:text-heading"
                      : ""
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
            {data.map((row, idx) => (
              <tr
                key={getRowId?.(row, idx) ?? idx}
                className={`transition-colors duration-150 hover:bg-secondary-50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${cellPadding} text-sm text-heading`}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
