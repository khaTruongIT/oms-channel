"use client";

import useSWR from "swr";
import api from "@/lib/api";

export enum UserRole {
  OWNER = "OWNER",
  WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER",
  SALES_STAFF = "SALES_STAFF",
}

export interface TenantMember {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  joinedAt: string;
}

export interface TenantInvite {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

export function useTenantMembers(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TenantMember[]>(
    tenantId ? `/tenants/${tenantId}/members` : null,
    async (url: string) => {
      const { data } = await api.get(url);
      return data;
    },
  );

  return {
    members: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTenantInvites(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TenantInvite[]>(
    tenantId ? `/tenants/${tenantId}/invites` : null,
    async (url: string) => {
      const { data } = await api.get(url);
      return data;
    },
  );

  return {
    invites: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function inviteMember(
  tenantId: string,
  email: string,
  role: UserRole,
) {
  const { data } = await api.post(`/tenants/${tenantId}/invites`, {
    email,
    role,
  });
  return data;
}

export async function cancelInvite(tenantId: string, inviteId: string) {
  const { data } = await api.delete(`/tenants/${tenantId}/invites/${inviteId}`);
  return data;
}

export async function removeMember(tenantId: string, userId: string) {
  const { data } = await api.delete(`/tenants/${tenantId}/members/${userId}`);
  return data;
}

export async function updateMemberRole(
  tenantId: string,
  userId: string,
  role: UserRole,
) {
  const { data } = await api.patch(
    `/tenants/${tenantId}/members/${userId}/role`,
    { role },
  );
  return data;
}
