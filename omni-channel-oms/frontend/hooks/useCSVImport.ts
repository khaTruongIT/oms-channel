/**
 * useCSVImport Hook
 * CSV file parsing, BOM handling, Vietnamese character support,
 * empty line skipping, and duplicate SKU detection.
 */

"use client";

import { useState } from "react";
import Papa from "papaparse";

export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
  duplicateSkus: string[];
}

export interface CSVValidationResult {
  valid: boolean;
  errors: string[];
}

export function parseCSVString(csvText: string): CSVData {
  // Strip UTF-8 BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, "");

  const parsed = Papa.parse<Record<string, string>>(cleanText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header: string) => header.trim().replace(/^\uFEFF/, ""),
    transform: (val: string) => (typeof val === "string" ? val.trim() : val),
  });

  const headers = (parsed.meta.fields || []).map((h) => h.trim()).filter(Boolean);
  const rows: Record<string, string>[] = [];
  const skuCounts = new Map<string, number>();

  for (const rawRow of parsed.data) {
    // Only accept non-empty rows
    const hasValues = Object.values(rawRow).some((v) => v !== undefined && v !== null && String(v).trim() !== "");
    if (!hasValues) continue;

    const row: Record<string, string> = {};
    for (const h of headers) {
      row[h] = rawRow[h] !== undefined && rawRow[h] !== null ? String(rawRow[h]).trim() : "";
    }
    rows.push(row);

    const skuKey = row["sku"] || row["skuCode"] || row["sku_code"];
    if (skuKey) {
      skuCounts.set(skuKey, (skuCounts.get(skuKey) || 0) + 1);
    }
  }

  const duplicateSkus: string[] = [];
  skuCounts.forEach((count, sku) => {
    if (count > 1) {
      duplicateSkus.push(sku);
    }
  });

  return {
    headers,
    rows,
    duplicateSkus,
  };
}

export function validateCSVData(
  data: CSVData,
  requiredFields: string[],
): CSVValidationResult {
  const errors: string[] = [];

  // Check required columns
  for (const field of requiredFields) {
    if (!data.headers.includes(field)) {
      errors.push(`Thiếu cột bắt buộc: ${field}`);
    }
  }

  // Check empty
  if (data.rows.length === 0) {
    errors.push("File CSV không có dữ liệu dòng");
  }

  // Check duplicate SKUs inside the file
  if (data.duplicateSkus.length > 0) {
    errors.push(
      `File có ${data.duplicateSkus.length} mã SKU bị trùng lặp: ${data.duplicateSkus.slice(0, 5).join(", ")}${
        data.duplicateSkus.length > 5 ? "..." : ""
      }`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function useCSVImport() {
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = (file: File): Promise<CSVData> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = (event.target?.result as string) || "";
          const data = parseCSVString(text);
          setCSVData(data);
          setIsLoading(false);
          resolve(data);
        } catch (err: any) {
          const errMsg = err?.message || "Không thể đọc dữ liệu file CSV";
          setError(errMsg);
          setIsLoading(false);
          reject(new Error(errMsg));
        }
      };

      reader.onerror = () => {
        const errMsg = "Lỗi khi đọc file CSV";
        setError(errMsg);
        setIsLoading(false);
        reject(new Error(errMsg));
      };

      reader.readAsText(file, "UTF-8");
    });
  };

  const validateData = (
    data: CSVData,
    requiredFields: string[],
  ): CSVValidationResult => {
    return validateCSVData(data, requiredFields);
  };

  const reset = () => {
    setCSVData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    csvData,
    isLoading,
    error,
    parseFile,
    validateData,
    reset,
  };
}
