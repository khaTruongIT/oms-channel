import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]): string {
  return clsx(values);
}

export const surface =
  "border border-[color:var(--border)] bg-white shadow-[0_12px_32px_-18px_rgba(8,74,120,0.25)]";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--secondary)] focus-visible:ring-offset-2";

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[color:var(--primary-container)] active:scale-[0.98]",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--secondary)] bg-[color:var(--ice)] px-5 py-3 text-sm font-bold text-[color:var(--primary)] transition hover:bg-white",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[color:var(--primary)] transition hover:bg-[color:var(--ice)]",
} as const;
