"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { acceptInvite } from "@/hooks/useTenantMembers";
import { setCurrentTenant, Tenant } from "@/hooks/useTenants";
import { useProfile } from "@/hooks/useProfile";
import { authService } from "@/lib/auth";
import Button from "@/components/ui/Button";
import {
  Building2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTenant, setAcceptedTenant] = useState<Tenant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthenticated = authService.isAuthenticated();
  const { profile, isLoading: isProfileLoading } = useProfile();

  const handleAccept = async () => {
    if (!token) {
      setErrorMessage("Liên kết không hợp lệ hoặc thiếu mã token.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const tenant = await acceptInvite(token);
      setAcceptedTenant(tenant);
      setCurrentTenant(tenant);
      toast.success(`Chào mừng bạn tham gia workspace "${tenant.shopName}"!`);

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Không thể chấp nhận lời mời. Vui lòng kiểm tra lại thời hạn hoặc tài khoản.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Thiếu liên kết lời mời
            </h2>
            <p className="text-sm text-slate-600">
              Mã xác thực không tìm thấy trong địa chỉ URL. Vui lòng kiểm tra lại liên kết trong email hoặc thông báo của bạn.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`/invites/accept?token=${token}`);
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-600 text-white mb-3 shadow">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Omni OMS Workspace</h1>
            <p className="text-sm text-slate-500 mt-1">
              Lời mời tham gia hệ thống quản lý bán hàng đa kênh
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl space-y-6">
            <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-lg text-center space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                Lời mời tham gia tổ chức
              </p>
              <p className="text-sm text-slate-700">
                Bạn vừa nhận được lời mời tham gia workspace. Để chấp nhận lời mời, vui lòng đăng nhập bằng tài khoản email được mời.
              </p>
            </div>

            <div className="space-y-3">
              <Link href={`/login?returnUrl=${returnUrl}`} className="block">
                <Button className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập để tham gia
                </Button>
              </Link>
              <Link href={`/register?returnUrl=${returnUrl}`} className="block">
                <Button variant="outline" className="w-full">
                  Tạo tài khoản mới
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (acceptedTenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Chào mừng bạn gia nhập!
            </h2>
            <p className="text-sm text-slate-600">
              Bạn đã trở thành thành viên chính thức của workspace{" "}
              <strong>{acceptedTenant.shopName}</strong>. Đang chuyển hướng về bảng điều khiển...
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button className="w-full">
                  Đến bảng điều khiển ngay
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - Confirmation view
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-600 text-white mb-3 shadow">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Omni OMS Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Xác nhận lời mời tham gia tổ chức</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl space-y-6">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold shrink-0">
              <UserCheck className="w-5 h-5 text-slate-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-500">Đang đăng nhập với tư cách</p>
              <p className="text-sm font-medium text-slate-900 truncate">
                {profile?.email || (isProfileLoading ? "Đang tải..." : "")}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể chấp nhận lời mời</p>
                <p className="text-xs mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full text-sm font-semibold h-11"
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {isSubmitting ? "Đang xử lý..." : "Chấp nhận lời mời & Truy cập"}
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full text-xs">
                Từ chối và về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500 text-sm">Đang tải thông tin lời mời...</div>
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
