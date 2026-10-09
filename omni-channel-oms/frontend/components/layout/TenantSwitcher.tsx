"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  useTenants,
  getCurrentTenant,
  setCurrentTenant,
  Tenant,
} from "@/hooks/useTenants";

interface TenantSwitcherProps {
  onTenantChange?: (tenant: Tenant) => void;
}

export default function TenantSwitcher({
  onTenantChange,
}: TenantSwitcherProps) {
  const { tenants, isLoading } = useTenants();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(
    getCurrentTenant,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle tenant selection with useCallback to prevent re-creation
  const handleSelectTenant = useCallback(
    (tenant: Tenant) => {
      setCurrentTenantState(tenant);
      setCurrentTenant(tenant);
      setIsOpen(false);
      onTenantChange?.(tenant);
    },
    [onTenantChange],
  );

  useEffect(() => {
    const handleTenantChange = (event: Event) => {
      const tenant = (event as CustomEvent<Tenant | null>).detail;
      setCurrentTenantState(tenant);
    };

    window.addEventListener("tenantChanged", handleTenantChange);
    return () => window.removeEventListener("tenantChanged", handleTenantChange);
  }, []);

  // Auto-select first tenant if none selected
  useEffect(() => {
    if (tenants && tenants.length > 0 && !currentTenant) {
      const firstTenant = tenants[0];
      setCurrentTenant(firstTenant);
      onTenantChange?.(firstTenant);
    }
  }, [tenants, currentTenant, onTenantChange]);

  if (isLoading) {
    return (
      <div className="px-4 py-3 border-b border-border">
        <div className="h-10 bg-surface rounded animate-pulse" />
      </div>
    );
  }

  if (!tenants || tenants.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-b border-border" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {currentTenant?.shopName?.[0] || "T"}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-heading">
              {currentTenant?.shopName || "Select Tenant"}
            </p>
            <p className="text-xs text-body">
              {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-body transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-2 py-2 bg-white rounded-lg shadow-card border border-border max-h-64 overflow-y-auto">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {tenant.shopName?.[0] || "T"}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-heading">
                    {tenant.shopName}
                  </p>
                  <p className="text-xs text-body">{tenant.schemaName}</p>
                </div>
              </div>
              {currentTenant?.id === tenant.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
