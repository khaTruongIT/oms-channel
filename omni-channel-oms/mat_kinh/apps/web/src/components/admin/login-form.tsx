"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/login/actions";
import type { LoginActionState } from "@/app/admin/login/types";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white p-6 shadow-[var(--shadow-glass)] ring-1 ring-[color:var(--border-soft)]"
    >
      <h2 className="mb-6 text-lg font-extrabold text-[color:var(--primary)]">
        Đăng nhập
      </h2>

      {state.error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-200">
          {state.error}
        </div>
      )}

      {/* Email */}
      <div className="mb-4">
        <label
          className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]"
          htmlFor="email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl bg-[color:var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--primary)] outline-none ring-1 ring-transparent transition focus:ring-[color:var(--primary)] disabled:opacity-50"
          defaultValue=""
          disabled={isPending}
          id="email"
          name="email"
          placeholder="admin@optiqis.vn"
          required
          type="email"
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <label
          className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.08em] text-[color:var(--secondary)]"
          htmlFor="password"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="w-full rounded-xl bg-[color:var(--surface-soft)] px-4 py-3 pr-12 text-sm font-semibold text-[color:var(--primary)] outline-none ring-1 ring-transparent transition focus:ring-[color:var(--primary)] disabled:opacity-50"
            disabled={isPending}
            id="password"
            minLength={6}
            name="password"
            placeholder="••••••••••••"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--primary)]"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--primary)] px-4 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-glass)] transition hover:opacity-90 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>
    </form>
  );
}
