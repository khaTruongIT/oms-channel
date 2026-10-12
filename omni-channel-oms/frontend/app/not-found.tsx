import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <span className="text-6xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
        404
      </span>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Không tìm thấy trang
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6 text-sm">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Về bảng điều khiển
      </Link>
    </div>
  );
}
