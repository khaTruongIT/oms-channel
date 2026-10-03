"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Eye,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import type { User } from "@optiqis/shared";
import { logoutAction } from "@/app/admin/login/actions";
import {
  getUserInitials,
  ROLE_COLORS,
  ROLE_LABELS,
} from "@/lib/admin-user-display";

const adminNav = [
  { href: "/admin/articles", label: "Bài viết", icon: BookOpen },
  { href: "/admin/products", label: "Dòng kính", icon: Eye },
  { href: "/admin/clinics", label: "Phòng khám", icon: Hospital },
  { href: "/admin/leads", label: "Lead tư vấn", icon: UserRoundCheck },
  { href: "/admin/articles", label: "SEO & cấu hình", icon: Settings },
];

interface AdminShellProps {
  children: React.ReactNode;
  user: User | null;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user ? getUserInitials(user.name) : "?";
  const roleLabel = user ? ROLE_LABELS[user.role] : "";
  const roleBadgeClass = user ? ROLE_COLORS[user.role] : "";

  const NavLinks = () => (
    <nav className="mt-8 space-y-1">
      <Link
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
          pathname === "/admin/articles"
            ? "bg-[color:var(--primary)] text-white"
            : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--primary)]"
        }`}
        href="/admin/articles"
        onClick={() => setSidebarOpen(false)}
      >
        <LayoutDashboard size={18} />
        Dashboard
      </Link>
      {adminNav.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname.startsWith(item.href) && item.href !== "/admin/articles";
        return (
          <Link
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
              isActive
                ? "bg-[color:var(--primary)] text-white"
                : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--primary)]"
            }`}
            href={item.href}
            key={`${item.href}-${item.label}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const UserCard = () => (
    <div className="mt-6 rounded-xl bg-[color:var(--ice)] p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[color:var(--primary)] text-sm font-extrabold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-[color:var(--primary)]">
            {user?.name ?? "Chưa đăng nhập"}
          </div>
          {user && (
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${roleBadgeClass}`}
            >
              {roleLabel}
            </span>
          )}
        </div>
      </div>
      {user && (
        <form action={logoutAction} className="mt-3">
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[color:var(--muted)] transition hover:bg-white hover:text-red-500"
            type="submit"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </form>
      )}
    </div>
  );

  const SidebarContent = () => (
    <>
      <Link className="flex items-center gap-3" href="/admin/articles">
        <span className="grid size-10 place-items-center rounded-xl bg-[color:var(--primary)] text-white shadow-[var(--shadow-glass)]">
          <ShieldCheck size={22} />
        </span>
        <span>
          <span className="block font-extrabold text-[color:var(--primary)]">
            OPTIQIS CMS
          </span>
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[color:var(--secondary)]">
            Medical Editorial
          </span>
        </span>
      </Link>
      <UserCard />
      <NavLinks />
    </>
  );

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r border-[color:var(--border-soft)] bg-white p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[280px]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <button
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[color:var(--primary)]">
                Menu
              </span>
              <button
                aria-label="Đóng"
                className="grid size-9 place-items-center rounded-xl hover:bg-[color:var(--surface-soft)]"
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="min-w-0 lg:pl-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-[color:var(--border-soft)] bg-white/84 px-5 backdrop-blur-xl lg:px-8">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              aria-label="Mở menu"
              className="grid size-10 place-items-center rounded-xl hover:bg-[color:var(--surface-soft)]"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <Menu size={20} />
            </button>
            <Link className="flex items-center gap-2" href="/admin/articles">
              <span className="grid size-8 place-items-center rounded-xl bg-[color:var(--primary)] text-white">
                <ShieldCheck size={16} />
              </span>
              <span className="text-sm font-extrabold text-[color:var(--primary)]">
                OPTIQIS CMS
              </span>
            </Link>
          </div>

          {/* Desktop: search bar */}
          <div className="hidden min-h-10 w-full max-w-md items-center gap-2 rounded-xl bg-[color:var(--surface-soft)] px-3 lg:flex">
            <Search size={18} className="text-[color:var(--secondary)]" />
            <span className="text-sm font-semibold text-[color:var(--muted)]">
              Tìm kiếm nhanh trong CMS...
            </span>
            <kbd className="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--outline)] shadow-sm">
              ⌘K
            </kbd>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              className="hidden rounded-full bg-[color:var(--ice)] px-4 py-2 text-sm font-extrabold text-[color:var(--primary)] sm:inline-flex"
              href="/"
              target="_blank"
            >
              Xem website
            </Link>
            <button
              className="grid size-10 place-items-center rounded-full bg-[color:var(--surface-soft)] text-[color:var(--primary)]"
              type="button"
              title="Thông báo (sắp ra mắt)"
            >
              <Bell size={18} />
            </button>
            {/* Avatar with role tooltip */}
            <div
              className={`grid size-10 place-items-center rounded-full text-sm font-extrabold ${
                user
                  ? ROLE_COLORS[user.role]
                  : "bg-[color:var(--surface-soft)] text-[color:var(--muted)]"
              }`}
              title={user ? `${user.name} — ${roleLabel}` : "Chưa đăng nhập"}
            >
              {initials}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
