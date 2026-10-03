/**
 * DateRangePicker Component
 * Date range selector for reports
 */

"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  {
    label: "Last 7 days",
    getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  {
    label: "This month",
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">
          {format(value.start, "MMM dd, yyyy")} -{" "}
          {format(value.end, "MMM dd, yyyy")}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
            <div className="p-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
