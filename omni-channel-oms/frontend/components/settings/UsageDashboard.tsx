"use client";

import {
  useTenantUsage,
  UsageStats,
  TenantPlan,
  Tenant,
} from "@/hooks/useTenants";

interface UsageDashboardProps {
  tenant: Tenant | null;
}

const PLAN_DETAILS: Record<
  TenantPlan,
  { name: string; description: string; color: string }
> = {
  [TenantPlan.FREE]: {
    name: "Free",
    description: "Basic features for getting started",
    color: "bg-gray-500",
  },
  [TenantPlan.STARTER]: {
    name: "Starter",
    description: "Perfect for small businesses",
    color: "bg-blue-500",
  },
  [TenantPlan.PROFESSIONAL]: {
    name: "Professional",
    description: "Advanced features for growing teams",
    color: "bg-purple-500",
  },
  [TenantPlan.ENTERPRISE]: {
    name: "Enterprise",
    description: "Unlimited everything for large organizations",
    color: "bg-amber-500",
  },
};

function UsageMeter({
  label,
  current,
  max,
  percentage,
  icon,
}: {
  label: string;
  current: number;
  max: number;
  percentage: number;
  icon: React.ReactNode;
}) {
  const isUnlimited = max === -1;
  const getColorClass = () => {
    if (isUnlimited) return "bg-blue-500";
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">
              {isUnlimited ? "Unlimited" : `${current} of ${max}`}
            </p>
          </div>
        </div>
        <span
          className={`text-sm font-semibold ${percentage >= 90 ? "text-red-600" : "text-gray-900"}`}
        >
          {isUnlimited ? "∞" : `${percentage}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${isUnlimited ? 0 : Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Warning Message */}
      {percentage >= 90 && !isUnlimited && (
        <p className="mt-2 text-xs text-red-600">
          ⚠️ Approaching limit. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}

export default function UsageDashboard({ tenant }: UsageDashboardProps) {
  const { usage, isLoading, isError } = useTenantUsage(tenant?.id || null);
  const plan = tenant?.plan || TenantPlan.FREE;
  const planDetails = PLAN_DETAILS[plan];

  if (!tenant) {
    return (
      <div className="text-center py-8 text-gray-500">No tenant selected</div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-100 h-24 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 h-28 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load usage data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${planDetails.color}`} />
              <span className="text-sm font-medium text-slate-300">
                Current Plan
              </span>
            </div>
            <h3 className="text-2xl font-bold">{planDetails.name}</h3>
            <p className="text-slate-400 mt-1">{planDetails.description}</p>
          </div>

          {plan !== TenantPlan.ENTERPRISE && (
            <button className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors">
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Usage Meters */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Resource Usage
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UsageMeter
            label="Products"
            current={usage?.products.current || 0}
            max={usage?.products.max || tenant.maxProducts}
            percentage={usage?.products.percentage || 0}
            icon={
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
          />
          <UsageMeter
            label="Warehouses"
            current={usage?.warehouses.current || 0}
            max={usage?.warehouses.max || tenant.maxWarehouses}
            percentage={usage?.warehouses.percentage || 0}
            icon={
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            }
          />
          <UsageMeter
            label="Sales Channels"
            current={usage?.channels.current || 0}
            max={usage?.channels.max || tenant.maxChannels}
            percentage={usage?.channels.percentage || 0}
            icon={
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Plan Limits
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-3">Feature</th>
                <th className="pb-3">Free</th>
                <th className="pb-3">Starter</th>
                <th className="pb-3">Pro</th>
                <th className="pb-3">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-t border-gray-200">
                <td className="py-2">Products</td>
                <td className="py-2">100</td>
                <td className="py-2">500</td>
                <td className="py-2">2,000</td>
                <td className="py-2">Unlimited</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="py-2">Warehouses</td>
                <td className="py-2">1</td>
                <td className="py-2">3</td>
                <td className="py-2">10</td>
                <td className="py-2">Unlimited</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="py-2">Sales Channels</td>
                <td className="py-2">3</td>
                <td className="py-2">5</td>
                <td className="py-2">10</td>
                <td className="py-2">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
