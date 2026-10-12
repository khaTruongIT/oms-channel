"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { isFeatureEnabled, FeatureFlags } from "../../lib/features";

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureGate({
  feature,
  children,
  fallback,
}: FeatureGateProps) {
  const enabled = isFeatureEnabled(feature);

  if (!enabled) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
          🚧
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tính năng đang hoàn thiện
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-sm">
          Tính năng này đang được nâng cấp để đảm bảo tính ổn định và tương thích dữ liệu đa sàn. Vui lòng quay lại sau!
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Về bảng điều khiển``
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
