'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App-level error caught:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
        !
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Đã có lỗi xảy ra
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-sm">
        {error.message || 'Hệ thống gặp sự cố không mong muốn khi tải trang này.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
