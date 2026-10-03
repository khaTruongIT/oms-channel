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
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
  }[];
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  actions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
        <span className="font-medium">
          {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
        </span>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "secondary"}
              onClick={action.onClick}
              className="text-sm"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        <button
          onClick={onClear}
          className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
