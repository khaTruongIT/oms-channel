/**
 * CSVUploader Component
 * File upload with drag & drop
 */

"use client";

import { useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import Button from "../ui/Button";

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  onClear?: () => void;
}

export default function CSVUploader({
  onFileSelect,
  selectedFile,
  onClear,
}: CSVUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "text/csv") {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (selectedFile) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {selectedFile.name}
              </div>
              <div className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </div>
            </div>
          </div>
          {onClear && (
            <Button variant="secondary" onClick={onClear}>
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload" className="cursor-pointer">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload CSV File
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your CSV file here, or click to browse
        </p>
        <Button variant="primary" type="button">
          Select File
        </Button>
      </label>
    </div>
  );
}
