"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import NotificationsDropdown from "./NotificationsDropdown";
import GlobalSearch from "@/components/ui/GlobalSearch";
import { Menu, X, Search } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Shortcut key handling: Cmd+K, Ctrl+K, and Slash (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-md cursor-pointer text-heading hover:bg-secondary-50 transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Spacer for mobile */}
            <div className="w-10 lg:hidden" />

            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center justify-between flex-1 max-w-md px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50/50 transition-colors cursor-pointer text-left shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="truncate">Tìm kiếm đơn, sản phẩm, khách...</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                <kbd>⌘K</kbd>
                <span className="text-slate-300">/</span>
                <kbd>/</kbd>
              </div>
            </button>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <NotificationsDropdown />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
