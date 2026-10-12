"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useTenantMembers,
  useTenantInvites,
  inviteMember,
  removeMember,
  updateMemberRole,
  cancelInvite,
  resendInvite,
  UserRole,
  TenantMember,
  TenantInvite,
} from "@/hooks/useTenantMembers";
import { usePermission } from "@/hooks/usePermission";
import { Tenant } from "@/hooks/useTenants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  UserPlus,
  Trash2,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
} from "lucide-react";

interface TeamManagementProps {
  tenant: Tenant | null;
}

export default function TeamManagement({ tenant }: TeamManagementProps) {
  const {
    members,
    isLoading: membersLoading,
    mutate: mutateMembers,
  } = useTenantMembers(tenant?.id || null);
  const {
    invites,
    isLoading: invitesLoading,
    mutate: mutateInvites,
  } = useTenantInvites(tenant?.id || null);

  const { hasPermission: canInvite } = usePermission("invite_member", tenant?.id);
  const { hasPermission: canResend } = usePermission("resend_invite", tenant?.id);
  const { hasPermission: canRemove } = usePermission("remove_member", tenant?.id);
  const { hasPermission: canChangeRole } = usePermission("change_role", tenant?.id);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.SALES_STAFF);
  const [isInviting, setIsInviting] = useState(false);

  // Result dialog for newly generated invite link
  const [generatedInviteResult, setGeneratedInviteResult] = useState<{
    email: string;
    inviteLink: string;
    emailStatus?: string;
  } | null>(null);

  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setIsInviting(true);
    try {
      const response = await inviteMember(tenant.id, inviteEmail, inviteRole);
      toast.success("Đã tạo lời mời thành công");
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole(UserRole.SALES_STAFF);
      mutateInvites();

      if (response?.inviteLink) {
        setGeneratedInviteResult({
          email: response.email || inviteEmail,
          inviteLink: response.inviteLink,
          emailStatus: response.emailStatus,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể gửi lời mời");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResend = async (inviteId: string) => {
    if (!tenant) return;

    setResendingInviteId(inviteId);
    try {
      const result = await resendInvite(tenant.id, inviteId);
      mutateInvites();

      if (result.success) {
        toast.success("Đã làm mới token và gửi lại lời mời");
        // Open modal with fresh link so owner can immediately copy
        const targetInvite = invites?.find((inv) => inv.id === inviteId);
        setGeneratedInviteResult({
          email: targetInvite?.email || "thành viên",
          inviteLink: result.inviteLink,
          emailStatus: result.emailStatus,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể gửi lại lời mời");
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleCopyLink = async (invite: TenantInvite) => {
    if (!tenant) return;

    // If invite already has link, copy directly
    if (invite.inviteLink) {
      await navigator.clipboard.writeText(invite.inviteLink);
      setCopiedInviteId(invite.id);
      toast.success("Đã sao chép liên kết vào bộ nhớ tạm");
      setTimeout(() => setCopiedInviteId(null), 2500);
      return;
    }

    // Otherwise rotate & fetch fresh link
    try {
      setResendingInviteId(invite.id);
      const result = await resendInvite(tenant.id, invite.id);
      mutateInvites();
      if (result.inviteLink) {
        await navigator.clipboard.writeText(result.inviteLink);
        setCopiedInviteId(invite.id);
        toast.success("Đã làm mới liên kết và sao chép vào bộ nhớ tạm");
        setTimeout(() => setCopiedInviteId(null), 2500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo liên kết mời");
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!tenant || !confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi workspace?"))
      return;

    try {
      await removeMember(tenant.id, userId);
      toast.success("Đã xóa thành viên thành công");
      mutateMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa thành viên");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!tenant || !confirm("Bạn có chắc chắn muốn hủy lời mời này?")) return;

    try {
      await cancelInvite(tenant.id, inviteId);
      toast.success("Đã hủy lời mời thành công");
      mutateInvites();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể hủy lời mời",
      );
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!tenant) return;

    try {
      await updateMemberRole(tenant.id, userId, newRole);
      toast.success("Đã cập nhật vai trò thành công");
      mutateMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể cập nhật vai trò");
    }
  };

  if (!tenant) return null;

  return (
    <div className="space-y-8">
      {/* Header & Invite Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Thành viên Workspace</h2>
          <p className="text-sm text-slate-500">
            Quản lý quyền truy cập và lời mời tham gia tổ chức
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Mời thành viên
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">
            Thành viên đang hoạt động ({members?.length || 0})
          </h3>
        </div>

        {membersLoading ? (
          <div className="p-8 text-center text-slate-500">
            Đang tải danh sách thành viên...
          </div>
        ) : members?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có thành viên nào</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {members?.map((member) => (
              <li
                key={member.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold border border-sky-200">
                    {(member.fullName || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.fullName || member.email}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as UserRole)
                    }
                    disabled={!canChangeRole || member.role === UserRole.OWNER}
                    className="text-xs border-slate-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {role === UserRole.OWNER
                          ? "Chủ sở hữu (Owner)"
                          : role === UserRole.WAREHOUSE_MANAGER
                          ? "Quản lý kho (Warehouse Manager)"
                          : "Nhân viên bán hàng (Sales Staff)"}
                      </option>
                    ))}
                  </select>

                  {canRemove && member.role !== UserRole.OWNER && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Xóa thành viên"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending Invites */}
      {invites && invites.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Lời mời đang chờ ({invites.length})
            </h3>
            <span className="text-xs text-slate-500">
              Token được bảo mật và tự động xoay khi gửi lại
            </span>
          </div>
          <ul className="divide-y divide-slate-200">
            {invites.map((invite) => {
              const isExpired = new Date(invite.expiresAt).getTime() < Date.now();
              return (
                <li
                  key={invite.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {invite.email}
                        </p>
                        {/* Email status badge */}
                        {invite.emailStatus === "SENT" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                            Đã gửi mail
                          </span>
                        ) : invite.emailStatus === "EMAIL_FAILED" ? (
                          <span
                            title={invite.emailError || "Lỗi gửi email"}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                            Lỗi gửi mail
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                            Đang chờ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 space-x-2 mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {invite.role === UserRole.WAREHOUSE_MANAGER
                            ? "Quản lý kho"
                            : "Nhân viên"}
                        </span>
                        <span>•</span>
                        <span className={isExpired ? "text-rose-600 font-medium" : ""}>
                          {isExpired
                            ? "Đã hết hạn"
                            : `Hết hạn: ${new Date(invite.expiresAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {/* Copy Link Button */}
                    {canResend && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(invite)}
                        disabled={resendingInviteId === invite.id}
                        className="text-xs h-8"
                      >
                        {copiedInviteId === invite.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Sao chép link
                          </>
                        )}
                      </Button>
                    )}

                    {/* Resend Button */}
                    {canResend && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(invite.id)}
                        disabled={resendingInviteId === invite.id}
                        className="text-xs h-8"
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 mr-1 ${
                            resendingInviteId === invite.id ? "animate-spin" : ""
                          }`}
                        />
                        Gửi lại
                      </Button>
                    )}

                    {/* Cancel Button */}
                    {canInvite && (
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Mời thành viên mới vào Workspace"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Địa chỉ Email
            </label>
            <Input
              type="email"
              placeholder="dongnghiep@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Vai trò (Role)
            </label>
            <div className="space-y-2">
              {[
                {
                  value: UserRole.WAREHOUSE_MANAGER,
                  label: "Quản lý kho (Warehouse Manager)",
                  desc: "Toàn quyền quản lý tồn kho, kho hàng, danh mục và xử lý đơn.",
                },
                {
                  value: UserRole.SALES_STAFF,
                  label: "Nhân viên bán hàng (Sales Staff)",
                  desc: "Xem đơn hàng và tồn kho, không có quyền cấu hình hệ thống.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex p-3 rounded-lg border cursor-pointer transition-colors ${
                    inviteRole === option.value
                      ? "border-sky-500 bg-sky-50/60 ring-1 ring-sky-500"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={inviteRole === option.value}
                    onChange={() => setInviteRole(option.value)}
                    className="mt-1 h-4 w-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-slate-900">
                      {option.label}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {option.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? "Đang gửi..." : "Tạo và gửi lời mời"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Generated Invite Link Dialog */}
      <Modal
        isOpen={!!generatedInviteResult}
        onClose={() => setGeneratedInviteResult(null)}
        title="Liên kết mời tham gia Workspace"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Lời mời đã được tạo cho{" "}
            <strong>{generatedInviteResult?.email}</strong>.
            {generatedInviteResult?.emailStatus === "EMAIL_FAILED" ? (
              <span className="block mt-1 text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-xs">
                ⚠️ Không thể gửi qua email lúc này (có thể do cấu hình Resend trong môi trường thử nghiệm). Bạn có thể sao chép liên kết bên dưới để gửi trực tiếp!
              </span>
            ) : (
              <span className="block mt-1 text-slate-500 text-xs">
                Email đã được gửi tự động. Bạn cũng có thể sao chép liên kết để gửi qua Zalo, Slack hoặc Messenger:
              </span>
            )}
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={generatedInviteResult?.inviteLink || ""}
              className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono select-all focus:outline-none"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (generatedInviteResult?.inviteLink) {
                  await navigator.clipboard.writeText(
                    generatedInviteResult.inviteLink,
                  );
                  toast.success("Đã sao chép liên kết lời mời!");
                }
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              Sao chép
            </Button>
          </div>

          <div className="pt-3 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setGeneratedInviteResult(null)}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
