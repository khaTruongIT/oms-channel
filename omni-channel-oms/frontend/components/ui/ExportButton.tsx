/**
 * ExportButton Component
 * CSV export functionality for tables
 */

"use client";

import { Download } from "lucide-react";
import type { ReactNode } from "react";
import Button from "./Button";
import { exportToCSV } from "@/lib/export";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  headers?: string[];
  variant?: "primary" | "secondary" | "danger";
  children?: ReactNode;
}

export default function ExportButton({
  data,
  filename,
  headers,
  variant = "secondary",
  children,
}: ExportButtonProps) {
  const handleExport = (): void => {
  exportToCSV(data, filename, headers);
  };

  return (
    <Button variant={variant} onClick={handleExport}>
      {children ?? (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </>
      )}
    </Button>
  );
}
