/**
 * Breadcrumbs Component
 * Auto-generated breadcrumb navigation from route
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const paths = pathname.split("/").filter(Boolean);

  if (paths.length === 0) {
    return null;
  }

  const breadcrumbs = paths.map((path, index) => {
    const href = "/" + paths.slice(0, index + 1).join("/");
    const label = path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return { href, label };
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link
        href="/"
        className="hover:text-primary transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-primary transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
