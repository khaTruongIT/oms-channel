"use client";

import { useSyncExternalStore } from "react";
import useSWR from "swr";
import api from "@/lib/api";

export enum BusinessType {
  RETAIL = "retail",
  WHOLESALE = "wholesale",
  DISTRIBUTOR = "distributor",
  MANUFACTURER = "manufacturer",
}

export enum TenantPlan {
  FREE = "free",
  STARTER = "starter",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise",
}

export enum TenantStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  CANCELLED = "cancelled",
}

export interface Tenant {
  id: string;
  schemaName: string;
  shopName: string;
  ownerId: string;
  isActive: boolean;
  status: TenantStatus;
  suspendedAt: string | null;
  suspendedReason: string | null;
  cancelledAt: string | null;
  onboardingCompleted: boolean;

  // Contact Information
  contactEmail?: string;
  contactPhone?: string;
  website?: string;

  // Address Information
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  // Business Information
  businessName?: string;
  businessType?: BusinessType;
  taxId?: string;
  registrationNumber?: string;

  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // Settings
  timezone: string;
  currency: string;
  locale: string;
  dateFormat: string;

  // Subscription & Limits
  plan: TenantPlan;
  maxChannels: number;
  maxProducts: number;
  maxWarehouses: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  shopName: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  businessName?: string;
  businessType?: BusinessType;
  taxId?: string;
  registrationNumber?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  dateFormat?: string;
}

export interface UpdateTenantInput extends Partial<CreateTenantInput> {
  isActive?: boolean;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);
const tenantChangedEvent = "tenantChanged";

export function useTenants() {
  const { data, error, isLoading, mutate } = useSWR<Tenant[]>(
    "/tenants",
    fetcher,
  );

  return {
    tenants: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTenant(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Tenant>(
    tenantId ? `/tenants/${tenantId}` : null,
    fetcher,
  );

  return {
    tenant: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Usage Stats
export interface UsageStats {
  channels: { current: number; max: number; percentage: number };
  products: { current: number; max: number; percentage: number };
  warehouses: { current: number; max: number; percentage: number };
}

export function useTenantUsage(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<UsageStats>(
    tenantId ? `/tenants/${tenantId}/usage` : null,
    fetcher,
  );

  return {
    usage: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Tenant CRUD
export async function createTenant(input: CreateTenantInput) {
  const { data } = await api.post("/tenants", input);
  return data;
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput) {
  const { data } = await api.patch(`/tenants/${tenantId}`, input);
  return data;
}

// Tenant Status Management
export async function activateTenant(tenantId: string) {
  const { data } = await api.post(`/tenants/${tenantId}/activate`);
  return data;
}

export async function suspendTenant(tenantId: string, reason: string) {
  const { data } = await api.post(`/tenants/${tenantId}/suspend`, { reason });
  return data;
}

export async function cancelTenant(tenantId: string) {
  const { data } = await api.post(`/tenants/${tenantId}/cancel`);
  return data;
}

export async function completeOnboarding(tenantId: string) {
  const { data } = await api.post(`/tenants/${tenantId}/complete-onboarding`);
  return data;
}

// Tenant context helpers
export function getCurrentTenant(): Tenant | null {
  if (typeof window === "undefined") return null;
  const tenantStr = localStorage.getItem("currentTenant");
  if (!tenantStr) return null;

  try {
    const parsed: unknown = JSON.parse(tenantStr);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      typeof parsed.id === "string"
    ) {
      return parsed as Tenant;
    }
  } catch {
    return null;
  }

  return null;
}

export function setCurrentTenant(tenant: Tenant) {
  localStorage.setItem("currentTenant", JSON.stringify(tenant));
  window.dispatchEvent(new CustomEvent(tenantChangedEvent, { detail: tenant }));
}

export function clearCurrentTenant() {
  localStorage.removeItem("currentTenant");
  window.dispatchEvent(new CustomEvent(tenantChangedEvent, { detail: null }));
}

function subscribeToTenantChanges(onStoreChange: () => void): () => void {
  window.addEventListener(tenantChangedEvent, onStoreChange);
  return () => window.removeEventListener(tenantChangedEvent, onStoreChange);
}

function getCurrentTenantId(): string | null {
  return getCurrentTenant()?.id ?? null;
}

export function useCurrentTenantId(): string | null {
  return useSyncExternalStore(
    subscribeToTenantChanges,
    getCurrentTenantId,
    () => null,
  );
}
