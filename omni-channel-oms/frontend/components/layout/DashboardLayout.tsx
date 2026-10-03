"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import { Menu, X, Bell, Search } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm text-heading placeholder:text-body/60 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-body hover:text-heading hover:bg-white rounded-lg transition-colors cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
