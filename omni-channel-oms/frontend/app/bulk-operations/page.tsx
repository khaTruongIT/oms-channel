/**
 * Bulk Operations Page - S4.1.6 & S4.1.7
 * Multi-step wizard: Upload -> Preview with Error Highlighting -> Progress -> Result Summary + Download Error CSV
 */

"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CSVUploader from "@/components/bulk/CSVUploader";
import Button from "@/components/ui/Button";
import { useCSVImport } from "@/hooks/useCSVImport";
import {
  useBulkOperations,
  BulkJobType,
  BulkValidationResult,
  BulkJobDetails,
  getBulkJobStatus,
} from "@/hooks/useBulkOperations";
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import FeatureGate from "@/components/layout/FeatureGate";

type ImportType = "products" | "inventory";

const TEMPLATES: Record<ImportType, { filename: string; headers: string[]; type: BulkJobType }> = {
  products: {
    filename: "products-import-template.csv",
    headers: ["sku", "name", "price"],
    type: "PRODUCT_IMPORT",
  },
  inventory: {
    filename: "inventory-import-template.csv",
    headers: ["sku", "warehouse", "quantity"],
    type: "INVENTORY_IMPORT",
  },
};

export default function BulkOperationsPage() {
  const [importType, setImportType] = useState<ImportType>("products");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "complete">("upload");
  const [dryRunResult, setDryRunResult] = useState<BulkValidationResult | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [progressJob, setProgressJob] = useState<BulkJobDetails | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { csvData, error: parseError, parseFile, validateData, reset: resetCSV } = useCSVImport();
  const { runJob, downloadErrors } = useBulkOperations();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const data = await parseFile(file);
      const template = TEMPLATES[importType];
      const validation = validateData(data, template.headers);

      if (!validation.valid) {
        toast.error(validation.errors.join("; "));
        return;
      }

      // Automatically execute dry-run validation with backend
      setIsDryRunning(true);
      setStep("preview");

      try {
        const { dryRunBulkJob } = await import("@/hooks/useBulkOperations");
        const dryRun = await dryRunBulkJob(template.type, data.rows);
        setDryRunResult(dryRun);
        if (dryRun.valid) {
          toast.success(`Đã kiểm tra ${data.rows.length} dòng. Dữ liệu hợp lệ để nhập!`);
        } else {
          toast.warning(
            `Phát hiện ${dryRun.summary.invalidCount} dòng có lỗi cần kiểm tra lại.`,
          );
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Lỗi kiểm tra dữ liệu với máy chủ");
      } finally {
        setIsDryRunning(false);
      }
    } catch {
      toast.error("Không thể đọc hoặc phân tích file CSV");
    }
  };

  const handleClear = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setSelectedFile(null);
    setStep("upload");
    setDryRunResult(null);
    setProgressJob(null);
    resetCSV();
  };

  const startProcessing = async () => {
    if (!csvData || csvData.rows.length === 0) return;

    const template = TEMPLATES[importType];
    const idempotencyKey = `bulk-job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    setStep("processing");

    try {
      const initialJob = await runJob(template.type, csvData.rows, idempotencyKey);
      setProgressJob(initialJob);

      // Start polling status
      const jobId = initialJob.id;
      let attempts = 0;
      const maxAttempts = 60; // 60 * 1.5s = 90s

      pollingRef.current = setInterval(async () => {
        attempts++;
        try {
          const freshJob = await getBulkJobStatus(jobId);
          setProgressJob(freshJob);

          if (freshJob.status === "COMPLETED" || freshJob.status === "FAILED") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setStep("complete");
            if (freshJob.status === "COMPLETED") {
              toast.success(`Hoàn thành xử lý ${freshJob.processed} dòng thành công!`);
            } else {
              toast.error("Tiến trình nhập hàng loạt gặp sự cố.");
            }
          } else if (attempts >= maxAttempts) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setStep("complete");
            toast.error("Tiến trình quá thời gian chờ (timeout). Vui lòng kiểm tra lại sau.");
          }
        } catch (err) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStep("complete");
        }
      }, 1500);
    } catch (err: any) {
      setStep("preview");
      toast.error(err?.response?.data?.message || "Không thể khởi động tiến trình nhập");
    }
  };

  const downloadTemplate = () => {
    const template = TEMPLATES[importType];
    const headerLine = template.headers.join(",");
    const sampleLine =
      importType === "products"
        ? "SKU-AO-001,Áo thun cotton thoáng mát,150000"
        : "SKU-AO-001,KHO_TONG,50";
    const csvContent = "\uFEFF" + `${headerLine}\n${sampleLine}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRowError = (rowIndex: number): string | undefined => {
    if (!dryRunResult || !dryRunResult.errors) return undefined;
    const match = dryRunResult.errors.find((e) => e.row === rowIndex + 1);
    return match ? `${match.field ? `[${match.field}] ` : ""}${match.message}` : undefined;
  };

  return (
    <DashboardLayout>
      <FeatureGate feature="bulkOperations">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-heading">Xử lý Hàng loạt (Bulk Jobs)</h1>
              <p className="text-body mt-1">
                Nhập hoặc điều chỉnh danh mục sản phẩm và tồn kho số lượng lớn từ file CSV
              </p>
            </div>
            <Button variant="secondary" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Tải mẫu CSV chuẩn
            </Button>
          </div>

          {/* Stepper Header */}
          <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === "upload"
                      ? "bg-primary-600 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  1
                </span>
                <span className="text-sm font-medium text-gray-900">Tải file</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === "preview"
                      ? "bg-primary-600 text-white"
                      : step === "processing" || step === "complete"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  2
                </span>
                <span className="text-sm font-medium text-gray-900">Kiểm tra & Preview</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === "processing"
                      ? "bg-primary-600 text-white animate-pulse"
                      : step === "complete"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  3
                </span>
                <span className="text-sm font-medium text-gray-900">Xử lý & Kết quả</span>
              </div>
            </div>
          </div>

          {/* Import Type Selector (Only active in Upload step) */}
          {step === "upload" && (
            <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Chọn nghiệp vụ nhập dữ liệu
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["products", "inventory"] as ImportType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setImportType(type);
                      handleClear();
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      importType === type
                        ? "border-primary-500 bg-primary-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900 capitalize mb-1 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary-600" />
                      {type === "products" ? "Sản phẩm (Products)" : "Tồn kho (Inventory)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Cột yêu cầu: {TEMPLATES[type].headers.join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === "upload" && (
            <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Tải lên file dữ liệu CSV
              </h2>
              <CSVUploader
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile || undefined}
                onClear={handleClear}
              />
              {parseError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-900">Lỗi phân tích file</div>
                    <div className="text-sm text-red-700">{parseError}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Preview & Dry-Run Result */}
          {step === "preview" && csvData && (
            <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Xem trước dữ liệu ({csvData.rows.length} dòng)
                  </h2>
                  <p className="text-sm text-gray-500">
                    File: <span className="font-medium text-gray-800">{selectedFile?.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={handleClear} disabled={isDryRunning}>
                    Hủy & Chọn file khác
                  </Button>
                  <Button
                    variant="primary"
                    onClick={startProcessing}
                    disabled={isDryRunning}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bắt đầu nhập dữ liệu
                  </Button>
                </div>
              </div>

              {/* Validation Summary Badge */}
              {isDryRunning ? (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-3 text-sky-800 text-sm">
                  <RotateCw className="w-4 h-4 animate-spin text-sky-600" />
                  Đang kiểm tra tính hợp lệ của dữ liệu với máy chủ...
                </div>
              ) : dryRunResult ? (
                <div
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    dryRunResult.valid
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  {dryRunResult.valid ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <div className="font-semibold">
                      {dryRunResult.valid
                        ? "Dữ liệu hợp lệ 100%"
                        : `Có ${dryRunResult.summary.invalidCount} / ${dryRunResult.summary.total} dòng chứa lỗi`}
                    </div>
                    {!dryRunResult.valid && (
                      <div className="mt-1 text-xs text-amber-800">
                        Các dòng có nền đỏ bên dưới chứa lỗi. Bạn vẫn có thể tiếp tục nhập các dòng
                        hợp lệ, các dòng lỗi sẽ được bỏ qua và xuất trong báo cáo lỗi.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Preview Table with row-level error indicators */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold text-gray-700 w-16"># Dòng</th>
                        {csvData.headers.map((h) => (
                          <th key={h} className="px-3 py-2.5 font-semibold text-gray-700">
                            {h}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 font-semibold text-gray-700">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {csvData.rows.slice(0, 15).map((row, idx) => {
                        const rowError = getRowError(idx);
                        return (
                          <tr
                            key={idx}
                            className={rowError ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-gray-50"}
                          >
                            <td className="px-3 py-2 font-mono text-xs text-gray-500">
                              {idx + 1}
                            </td>
                            {csvData.headers.map((h) => (
                              <td key={h} className="px-3 py-2 text-gray-900">
                                {row[h] || <span className="text-gray-400 italic">Trống</span>}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-xs">
                              {rowError ? (
                                <span className="inline-flex items-center gap-1 text-red-700 font-medium bg-red-100/80 px-2 py-0.5 rounded">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {rowError}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-100/80 px-2 py-0.5 rounded">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Hợp lệ
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {csvData.rows.length > 15 && (
                  <div className="px-4 py-2.5 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-200">
                    Hiển thị 15 trên tổng số {csvData.rows.length} dòng
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Processing Progress */}
          {step === "processing" && (
            <div className="bg-white rounded-xl shadow-card p-12 text-center border border-gray-100 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCw className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xử lý dữ liệu...</h2>
              <p className="text-sm text-gray-500 mb-6">
                Hệ thống đang thực hiện giao dịch theo từng batch 100 dòng để đảm bảo tính toàn vẹn.
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      progressJob && progressJob.total > 0
                        ? Math.min(
                            100,
                            Math.round(
                              ((progressJob.processed + progressJob.failed) / progressJob.total) *
                                100,
                            ),
                          )
                        : 20
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Đã xử lý: {(progressJob?.processed || 0) + (progressJob?.failed || 0)} /{" "}
                  {progressJob?.total || csvData?.rows.length || 0}
                </span>
                <span>
                  Lỗi: {progressJob?.failed || 0}
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Complete & Results */}
          {step === "complete" && (
            <div className="bg-white rounded-xl shadow-card p-8 border border-gray-100 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoàn thành tiến trình!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Tiến trình xử lý hàng loạt ({progressJob?.type || importType}) đã kết thúc.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-left">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500">Tổng số dòng</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {progressJob?.total || csvData?.rows.length || 0}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-medium">Thành công</div>
                  <div className="text-2xl font-bold text-emerald-900">
                    {progressJob?.processed || 0}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs text-red-700 font-medium">Thất bại / Lỗi</div>
                  <div className="text-2xl font-bold text-red-900">
                    {progressJob?.failed || 0}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {progressJob && progressJob.failed > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => downloadErrors(progressJob.id)}
                  >
                    <Download className="w-4 h-4 mr-2 text-red-600" />
                    Tải danh sách lỗi ({progressJob.failed} dòng)
                  </Button>
                )}
                <Button variant="primary" onClick={handleClear}>
                  Nhập thêm dữ liệu mới
                </Button>
              </div>
            </div>
          )}
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
