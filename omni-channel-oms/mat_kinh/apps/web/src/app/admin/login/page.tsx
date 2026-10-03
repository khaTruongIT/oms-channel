import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Đăng nhập — OPTIQIS CMS",
  description: "Đăng nhập vào hệ thống quản trị nội dung OPTIQIS",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[color:var(--primary)] text-white shadow-[var(--shadow-glass)]">
            <svg
              fill="none"
              height="28"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
              width="28"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[color:var(--primary)]">OPTIQIS CMS</h1>
          <p className="mt-1 text-sm font-semibold text-[color:var(--muted)]">
            Medical Editorial System
          </p>
        </div>

        <LoginForm />

        {/* Demo credentials hint */}
        <div className="mt-6 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--ice)] p-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]">
            Tài khoản demo
          </p>
          <div className="space-y-1.5 text-xs font-semibold text-[color:var(--muted)]">
            <div className="flex justify-between">
              <span>admin@optiqis.vn</span>
              <span className="rounded bg-white px-1.5 py-0.5 font-bold text-[color:var(--primary)]">ADMIN</span>
            </div>
            <div className="flex justify-between">
              <span>editor@optiqis.vn</span>
              <span className="rounded bg-white px-1.5 py-0.5 font-bold text-[color:var(--secondary)]">EDITOR</span>
            </div>
            <div className="flex justify-between">
              <span>reviewer@optiqis.vn</span>
              <span className="rounded bg-white px-1.5 py-0.5 font-bold text-[color:var(--muted)]">REVIEWER</span>
            </div>
            <p className="mt-2 text-center text-[color:var(--outline)]">
              Mật khẩu chung:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-[color:var(--primary)]">
                optiqis2026
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
