"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Link2,
  Settings,
  LogOut,
  Building2,
  History,
  Tags,
  ShieldAlert,
} from "lucide-react";
import { authService } from "@/lib/auth";
import TenantSwitcher from "./TenantSwitcher";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Warehouses", href: "/warehouses", icon: Building2 },
  { name: "Channels", href: "/channels", icon: Link2 },
  { name: "Exceptions", href: "/exceptions", icon: ShieldAlert },
];

const accountNav = [
  { name: "Activity", href: "/activity", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    void authService.signOut();
  };

  const NavItem = ({ item }: { item: (typeof navigation)[0] }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
          transition-all duration-150 cursor-pointer
          ${
            isActive
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }
        `}
      >
        <item.icon
          className={`w-5 h-5 ${isActive ? "text-primary-400" : "text-gray-500"}`}
        />
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-heading/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-[#111827] border-r border-gray-800
          transform transition-transform duration-300 ease-in-out shadow-xl
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
                O
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wide">
                  Omni OMS
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Order Management
                </p>
              </div>
            </div>
          </div>

          {/* Tenant Switcher */}
          <div className="border-b border-border">
            <TenantSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Main Navigation */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main
              </p>
              <div className="space-y-1">
                {navigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </p>
              <div className="space-y-1">
                {accountNav.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
