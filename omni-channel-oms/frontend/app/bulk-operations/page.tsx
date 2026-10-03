/**
 * Bulk Operations Page
 * CSV import with column mapping and preview
 */

"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CSVUploader from "@/components/bulk/CSVUploader";
import Button from "@/components/ui/Button";
import { useCSVImport } from "@/hooks/useCSVImport";
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type ImportType = "products" | "customers" | "inventory";

export default function BulkOperationsPage() {
  const [importType, setImportType] = useState<ImportType>("products");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
  const { csvData, error, parseFile, validateData, reset } =
    useCSVImport();

  const requiredFields: Record<ImportType, string[]> = {
    products: ["name", "sku", "price"],
    customers: ["name", "email"],
    inventory: ["sku", "quantity", "warehouse"],
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const data = await parseFile(file);
      const validation = validateData(data, requiredFields[importType]);

      if (!validation.valid) {
        toast.error(validation.errors.join(", "));
        return;
      }

      setStep("preview");
      toast.success("File parsed successfully!");
    } catch {
      toast.error("Failed to parse CSV file");
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setStep("upload");
    reset();
  };

  const handleImport = async () => {
    if (!csvData) return;

    try {
      // TODO: Implement actual import API call
      toast.success(`Importing ${csvData.rows.length} ${importType}...`);
      setStep("complete");
    } catch {
      toast.error("Import failed");
    }
  };

  const downloadTemplate = () => {
    const headers = requiredFields[importType].join(",");
    const blob = new Blob([headers], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${importType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-heading">Bulk Operations</h1>
            <p className="text-body mt-1">
              Import data in bulk using CSV files
            </p>
          </div>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Import Type Selector */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Import Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["products", "customers", "inventory"] as ImportType[]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setImportType(type);
                    handleClear();
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    importType === type
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900 capitalize mb-1">
                    {type}
                  </div>
                  <div className="text-sm text-gray-500">
                    Required: {requiredFields[type].join(", ")}
                  </div>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload CSV File
            </h2>
            <CSVUploader
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile || undefined}
              onClear={handleClear}
            />
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-900">Error</div>
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && csvData && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Preview ({csvData.rows.length} rows)
              </h2>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleClear}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleImport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {csvData.headers.map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {csvData.rows.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {csvData.headers.map((header) => (
                          <td
                            key={header}
                            className="px-4 py-3 text-sm text-gray-900"
                          >
                            {String(row[header] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.rows.length > 10 && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                  Showing 10 of {csvData.rows.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Import Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Successfully imported {csvData?.rows.length} {importType}
            </p>
            <Button variant="primary" onClick={handleClear}>
              Import More Data
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
