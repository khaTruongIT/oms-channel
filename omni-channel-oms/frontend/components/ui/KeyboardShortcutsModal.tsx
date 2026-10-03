/**
 * KeyboardShortcutsModal Component
 * Help modal showing available keyboard shortcuts (Cmd+/)
 */

"use client";

import { X, Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: ["⌘", "K"],
    description: "Open global search",
    category: "Navigation",
  },
  { keys: ["⌘", "N"], description: "Create new item", category: "Actions" },
  { keys: ["⌘", "/"], description: "Show shortcuts", category: "Help" },
  { keys: ["Esc"], description: "Close modal", category: "Navigation" },
  { keys: ["↑", "↓"], description: "Navigate list", category: "Navigation" },
  { keys: ["Enter"], description: "Select item", category: "Actions" },
  { keys: ["⌘", "S"], description: "Save form", category: "Actions" },
  { keys: ["⌘", "E"], description: "Export data", category: "Actions" },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Command className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-gray-500">Speed up your workflow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-gray-900">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Press{" "}
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded">
                Esc
              </kbd>{" "}
              to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
