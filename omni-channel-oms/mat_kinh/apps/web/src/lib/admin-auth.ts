import { cookies } from "next/headers";
import type { User } from "@optiqis/shared";
import { ADMIN_USER_COOKIE } from "@/lib/admin-cookies";

/** Read the currently authenticated user from the admin_user cookie (set at login). */
export async function getAdminUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
