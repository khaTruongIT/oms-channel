"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { LoginActionState } from "@/app/admin/login/types";
import { ADMIN_TOKEN_COOKIE, ADMIN_USER_COOKIE } from "@/lib/admin-cookies";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  let token: string;
  let userJson: string;

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? "Email hoặc mật khẩu không đúng." };
    }

    const data = (await res.json()) as { user: unknown; token: string };
    token = data.token;
    userJson = JSON.stringify(data.user);
  } catch {
    return { error: "Không thể kết nối đến máy chủ. Vui lòng thử lại." };
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Store non-sensitive user info in a readable cookie for the AdminShell RSC
  cookieStore.set(ADMIN_USER_COOKIE, userJson, {
    httpOnly: false, // readable by server components via cookies()
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  });

  redirect("/admin/articles");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
  cookieStore.delete(ADMIN_USER_COOKIE);
  redirect("/admin/login");
}
