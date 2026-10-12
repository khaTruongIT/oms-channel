"use client";

import { useMemo } from "react";
import { UserRole, useTenantMembers } from "./useTenantMembers";
import { useProfile } from "./useProfile";
import { useCurrentTenantId, useTenant } from "./useTenants";

export type PermissionAction =
  | "invite_member"
  | "resend_invite"
  | "cancel_invite"
  | "remove_member"
  | "change_role"
  | "manage_members"
  | "view_invites";

const OWNER_ONLY_ACTIONS = new Set<PermissionAction>([
  "invite_member",
  "resend_invite",
  "cancel_invite",
  "remove_member",
  "change_role",
  "manage_members",
  "view_invites",
]);

export function checkRolePermission(
  role: UserRole | string | null | undefined,
  action: PermissionAction,
): boolean {
  if (!role) return false;
  if (role === UserRole.OWNER || role === "OWNER") {
    return true;
  }

  if (OWNER_ONLY_ACTIONS.has(action)) {
    return false;
  }

  return false;
}

export function usePermission(
  action: PermissionAction,
  customTenantId?: string | null,
) {
  const activeTenantId = useCurrentTenantId();
  const effectiveTenantId = customTenantId ?? activeTenantId;

  const { profile, isLoading: isProfileLoading } = useProfile();
  const { tenant, isLoading: isTenantLoading } = useTenant(effectiveTenantId);
  const { members, isLoading: isMembersLoading } = useTenantMembers(effectiveTenantId);

  const role = useMemo<UserRole | null>(() => {
    if (!profile) return null;

    // Check if user is the tenant owner recorded on tenant record
    if (tenant && tenant.ownerId === profile.id) {
      return UserRole.OWNER;
    }

    // Otherwise find membership in active tenant members list
    if (members && members.length > 0) {
      const currentMember = members.find((m) => m.id === profile.id);
      if (currentMember) {
        return currentMember.role;
      }
    }

    return null;
  }, [profile, tenant, members]);

  const hasPermission = useMemo(() => {
    return checkRolePermission(role, action);
  }, [role, action]);

  return {
    hasPermission,
    role,
    isLoading: isProfileLoading || isTenantLoading || isMembersLoading,
  };
}
