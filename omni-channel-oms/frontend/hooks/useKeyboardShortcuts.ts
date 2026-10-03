/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcut manager
 */

"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Global shortcuts registry
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "k",
    meta: true,
    description: "Open global search",
    action: () => {}, // Will be overridden by useGlobalSearch
  },
  {
    key: "/",
    meta: true,
    description: "Show keyboard shortcuts",
    action: () => {}, // Will be overridden by KeyboardShortcutsModal
  },
  {
    key: "Escape",
    description: "Close modal/dialog",
    action: () => {}, // Handled by individual modals
  },
];
