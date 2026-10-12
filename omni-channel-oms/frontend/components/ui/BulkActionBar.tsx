/**
 * BulkActionBar Component
 * Toolbar for bulk actions on selected items
 */

"use client";

import { X } from "lucide-react";
import Button from "./Button";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
    isLoading?: boolean;
  }[];
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  isLoading = false,
  children,
  actions = [],
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-full px-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex flex-wrap items-center gap-3">
        <span className="font-medium text-sm whitespace-nowrap">
          {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
        </span>

        <div className="h-6 w-px bg-gray-700 hidden sm:block" />

        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "secondary"}
                onClick={action.onClick}
                disabled={action.disabled || isLoading}
                isLoading={action.isLoading}
                className="text-xs sm:text-sm py-1.5 px-3"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {children}

        <button
          onClick={onClear}
          disabled={isLoading}
          className="ml-auto p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
