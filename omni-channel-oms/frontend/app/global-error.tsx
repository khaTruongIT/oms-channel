'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lỗi ứng dụng nghiêm trọng
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            {error.message || 'Không thể hiển thị giao diện chính của ứng dụng.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Tải lại trang
            </button>
            <Link
              href="/login"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Về đăng nhập
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
