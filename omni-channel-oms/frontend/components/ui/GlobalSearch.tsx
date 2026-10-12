/**
 * Global Search Component - Sprint 5.1 (S5.1.3)
 * Cmd+K / Slash key shortcut to search across Orders, Products, and Customers
 * Debounced with AbortController for request cancellation.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Package,
  ShoppingCart,
  User,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface SearchResult {
  id: string;
  type: "order" | "product" | "customer";
  title: string;
  subtitle: string;
  url: string;
}

interface SearchApiResponse {
  query: string;
  items: SearchResult[];
  total: number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search API execution with AbortController
  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel any ongoing search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await api.get<SearchApiResponse>("/search", {
        params: { q: trimmed },
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResults(response.data?.items || []);
        setSelectedIndex(0);
      }
    } catch (error: any) {
      // Ignore cancellations
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return;
      }
      console.error("Global search error:", error);
      setResults([]);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // 300ms Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, performSearch]);

  // Cleanup abort controller on unmount or close
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            results.length > 0 ? (prev + 1) % results.length : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            results.length > 0
              ? (prev - 1 + results.length) % results.length
              : 0,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].url);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case "product":
        return <Package className="w-4 h-4 text-emerald-600" />;
      case "customer":
        return <User className="w-4 h-4 text-cyan-600" />;
    }
  };

  const getBadge = (type: SearchResult["type"]) => {
    switch (type) {
      case "order":
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Đơn hàng
          </span>
        );
      case "product":
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Sản phẩm
          </span>
        );
      case "customer":
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
            Khách hàng
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
              className="flex-1 outline-none text-slate-900 placeholder:text-slate-400 bg-transparent text-sm"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            {query && !isLoading && (
              <button
                onClick={() => setQuery("")}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {isLoading && results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang tìm kiếm...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      router.push(result.url);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {result.subtitle}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getBadge(result.type)}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Không tìm thấy kết quả nào cho "{query}"
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-800 text-sm">
                  Tìm kiếm toàn hệ thống
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập tối thiểu 2 ký tự để tra cứu đơn hàng, mã SKU sản phẩm hoặc khách hàng
                </p>
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-xs ml-1">↓</kbd> Di chuyển
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-xs">↵</kbd> Mở
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-xs">Esc</kbd> Đóng
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Omni-Channel OMS</span>
          </div>
        </div>
      </div>
    </>
  );
}
