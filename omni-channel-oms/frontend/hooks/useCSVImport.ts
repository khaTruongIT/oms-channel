/**
 * useCSVImport Hook
 * CSV file parsing and import management
 */

"use client";

import { useState } from "react";
import Papa from "papaparse";

export interface CSVColumn {
  field: string;
  mappedTo?: string;
}

export interface CSVData {
  headers: string[];
  rows: Record<string, unknown>[];
}

export function useCSVImport() {
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = (file: File): Promise<CSVData> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError(null);

      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsLoading(false);
          if (results.errors.length > 0) {
            const errorMsg = results.errors[0].message;
            setError(errorMsg);
            reject(new Error(errorMsg));
          } else {
            const data: CSVData = {
              headers: results.meta.fields || [],
              rows: results.data,
            };
            setCSVData(data);
            resolve(data);
          }
        },
        error: (error) => {
          setIsLoading(false);
          const errorMsg = error.message;
          setError(errorMsg);
          reject(error);
        },
      });
    });
  };

  const validateData = (
    data: CSVData,
    requiredFields: string[],
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if all required fields are present
    requiredFields.forEach((field) => {
      if (!data.headers.includes(field)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check if there's data
    if (data.rows.length === 0) {
      errors.push("CSV file is empty");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
