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
  UserRole,
  TenantMember,
  TenantInvite,
} from "@/hooks/useTenantMembers";
import { Tenant } from "@/hooks/useTenants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  UserPlus,
  MoreVertical,
  Trash2,
  Shield,
  Mail,
  Clock,
  CheckCircle,
  X,
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

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.SALES_STAFF);
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setIsInviting(true);
    try {
      await inviteMember(tenant.id, inviteEmail, inviteRole);
      toast.success("Invitation sent successfully");
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole(UserRole.SALES_STAFF);
      mutateInvites();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!tenant || !confirm("Are you sure you want to remove this member?"))
      return;

    try {
      await removeMember(tenant.id, userId);
      toast.success("Member removed successfully");
      mutateMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!tenant || !confirm("Cancel this invitation?")) return;

    try {
      await cancelInvite(tenant.id, inviteId);
      toast.success("Invitation cancelled");
      mutateInvites();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to cancel invitation",
      );
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!tenant) return;

    try {
      await updateMemberRole(tenant.id, userId, newRole);
      toast.success("Role updated successfully");
      mutateMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  if (!tenant) return null;

  return (
    <div className="space-y-8">
      {/* Header & Invite Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500">
            Manage who has access to this workspace
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">Active Members</h3>
        </div>

        {membersLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading members...
          </div>
        ) : members?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No members found</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {members?.map((member) => (
              <li
                key={member.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold border border-blue-200">
                    {member.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.fullName || member.email}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as UserRole)
                    }
                    disabled={member.role === UserRole.OWNER}
                    className="text-xs border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {role.replace("_", " ")}
                      </option>
                    ))}
                  </select>

                  {member.role !== UserRole.OWNER && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove member"
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">
              Pending Invitations
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 border border-yellow-200">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {invite.email}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {invite.role.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span>
                        Expires:{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="space-y-2">
              {[
                {
                  value: UserRole.WAREHOUSE_MANAGER,
                  label: "Warehouse Manager",
                  desc: "Can manage inventory, orders, and products.",
                },
                {
                  value: UserRole.SALES_STAFF,
                  label: "Sales Staff",
                  desc: "Can view orders and inventory, but limited management.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex p-3 rounded-lg border cursor-pointer transition-colors ${
                    inviteRole === option.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={inviteRole === option.value}
                    onChange={() => setInviteRole(option.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-500">
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
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
