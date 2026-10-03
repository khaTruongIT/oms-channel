/**
 * Global Search Component
 * Cmd+K keyboard shortcut to search across Orders, Products, Customers, Inventory
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Package,
  ShoppingCart,
  User,
  Warehouse,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "order" | "product" | "customer" | "inventory";
  title: string;
  subtitle: string;
  url: string;
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

  // Search function with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulated search results
      const mockResults: SearchResult[] = [
        {
          id: "1",
          type: "order",
          title: `Order #ORD-${searchQuery}`,
          subtitle: "Pending • $250.00",
          url: `/orders/1`,
        },
        {
          id: "2",
          type: "product",
          title: `Product matching "${searchQuery}"`,
          subtitle: "SKU: PRD-001 • $99.99",
          url: `/products/2`,
        },
      ];
      setResults(mockResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + results.length) % results.length,
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

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4" />;
      case "product":
        return <Package className="w-4 h-4" />;
      case "customer":
        return <User className="w-4 h-4" />;
      case "inventory":
        return <Warehouse className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, products, customers..."
              className="flex-1 outline-none text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.url);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.subtitle}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-1">
                  Search anything
                </p>
                <p className="text-sm">
                  Orders, products, customers, inventory...
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
