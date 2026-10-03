"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Store,
  Settings,
  ArrowRight,
  Search,
  Building2,
} from "lucide-react";
import {
  useTenants,
  setCurrentTenant,
  Tenant,
  TenantStatus,
  TenantPlan,
} from "@/hooks/useTenants";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

export default function TenantsPage() {
  const router = useRouter();
  const { tenants, isLoading } = useTenants();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.businessName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEnterTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    router.push("/dashboard");
  };

  const getStatusBadgeVariant = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return "success";
      case TenantStatus.PENDING:
        return "warning";
      case TenantStatus.SUSPENDED:
        return "danger";
      case TenantStatus.CANCELLED:
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">My Stores</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                />
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Store
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 h-48 animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No stores found
            </h3>
            <p className="text-gray-500 mt-1 mb-6">
              Get started by creating your first store.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Store
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                      {tenant.logoUrl ? (
                        <img
                          src={tenant.logoUrl}
                          alt={tenant.shopName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        tenant.shopName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(tenant.status)}>
                      {tenant.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                    {tenant.shopName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                    {tenant.businessName || "No business name"}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="capitalize">{tenant.plan} Plan</span>
                    </div>
                    {/* Add more stats here if available, e.g. member count */}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <Link
                    href="/settings"
                    onClick={() => setCurrentTenant(tenant)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleEnterTenant(tenant)}
                    disabled={tenant.status !== TenantStatus.ACTIVE}
                  >
                    Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tenant Modal - Placeholder for now, can implement CreateTenantForm in next iteration or use existing if compatible */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Store"
      >
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">
            Use the Onboarding Wizard to set up a new store.
          </p>
          <Button onClick={() => router.push("/onboarding")}>
            Go to Onboarding
          </Button>
        </div>
      </Modal>
    </div>
  );
}
