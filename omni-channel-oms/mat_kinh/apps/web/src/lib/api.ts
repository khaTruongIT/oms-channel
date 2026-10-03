import {
  articles,
  clinics,
  filterArticles,
  filterClinics,
  filterProducts,
  products,
  scoreSeo,
  type Article,
  type Clinic,
  type ConsultationLead,
  type LeadStatus,
  type Product,
  type SeoInput,
  type SeoResult,
} from "@optiqis/shared";
import { cookies } from "next/headers";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-cookies";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");

  // For admin routes, read the real JWT from the httpOnly cookie
  if (path.startsWith("/admin/") && !headers.has("authorization")) {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getProducts(
  search?: URLSearchParams,
): Promise<Product[]> {
  try {
    return await fetchJson<Product[]>(
      `/products${search ? `?${search.toString()}` : ""}`,
    );
  } catch {
    return filterProducts(products, {
      need: search?.get("need") ?? undefined,
      index: search?.get("index") ?? undefined,
      coating: search?.get("coating") ?? undefined,
    });
  }
}

export interface AdminInventoryItem {
  id: string;
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  safetyStock: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface AdminWarehouse {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface AdjustInventoryInput {
  masterSkuId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
}

export type OmsStatusState = "disabled" | "connected" | "degraded";
export type OmsStatusCheckState = "pass" | "fail" | "skipped";

export interface OmsStatusCheck {
  ok: boolean;
  state: OmsStatusCheckState;
  message: string;
}

export interface OmsStatus {
  enabled: boolean;
  state: OmsStatusState;
  message: string;
  checkedAt: string;
  checks: {
    configuration: OmsStatusCheck;
    authentication: OmsStatusCheck;
    products: OmsStatusCheck;
    warehouses: OmsStatusCheck;
  };
}

export interface CreateLeadInput {
  fullName: string;
  phone: string;
  email?: string;
  province?: string;
  district?: string;
  productId?: string;
  productName?: string;
  clinicId?: string;
  preferredTime?: string;
  note?: string;
  source: ConsultationLead["source"];
}

export interface LeadSubmissionResponse {
  id: string;
  status: LeadStatus;
  createdAt: string;
}

export async function getOmsStatus(): Promise<OmsStatus> {
  return fetchJson<OmsStatus>("/admin/oms/status");
}

export async function getAdminProducts(search?: URLSearchParams): Promise<Product[]> {
  return fetchJson<Product[]>(`/admin/products${search ? `?${search.toString()}` : ""}`);
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  try {
    return await fetchJson<Product>(`/admin/products/${id}`);
  } catch {
    return null;
  }
}

export async function createProduct(product: Omit<Product, "id">): Promise<Product> {
  return fetchJson<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  return fetchJson<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

export async function getProductInventory(id: string): Promise<AdminInventoryItem[]> {
  return fetchJson<AdminInventoryItem[]>(`/admin/products/${id}/inventory`);
}

export async function getWarehouses(): Promise<AdminWarehouse[]> {
  return fetchJson<AdminWarehouse[]>("/admin/warehouses");
}

export async function adjustInventory(input: AdjustInventoryInput): Promise<AdminInventoryItem> {
  return fetchJson<AdminInventoryItem>("/admin/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await fetchJson<Product>(`/products/${slug}`);
  } catch {
    return products.find((product) => product.slug === slug) ?? null;
  }
}

export async function getArticles(admin = false): Promise<Article[]> {
  try {
    return await fetchJson<Article[]>(admin ? "/admin/articles" : "/articles");
  } catch {
    return admin ? articles : filterArticles(articles, { status: "PUBLISHED" });
  }
}

export async function getArticle(
  slug: string,
  admin = false,
): Promise<Article | null> {
  const list = await getArticles(admin);
  return (
    list.find((article) => article.slug === slug || article.id === slug) ?? null
  );
}

export async function getClinics(search?: URLSearchParams): Promise<Clinic[]> {
  try {
    return await fetchJson<Clinic[]>(
      `/clinics${search ? `?${search.toString()}` : ""}`,
    );
  } catch {
    return filterClinics(clinics, {
      province: search?.get("province") ?? undefined,
      district: search?.get("district") ?? undefined,
      query: search?.get("query") ?? undefined,
    });
  }
}

export async function getAdminClinics(search?: URLSearchParams): Promise<Clinic[]> {
  return fetchJson<Clinic[]>(`/admin/clinics${search ? `?${search.toString()}` : ""}`);
}

export async function getAdminClinic(id: string): Promise<Clinic | null> {
  try {
    return await fetchJson<Clinic>(`/admin/clinics/${id}`);
  } catch {
    return null;
  }
}

export async function createClinic(clinic: Omit<Clinic, "id">): Promise<Clinic> {
  return fetchJson<Clinic>("/admin/clinics", {
    method: "POST",
    body: JSON.stringify(clinic),
  });
}

export async function updateClinic(id: string, clinic: Partial<Clinic>): Promise<Clinic> {
  return fetchJson<Clinic>(`/admin/clinics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(clinic),
  });
}

export async function deleteClinic(id: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`/admin/clinics/${id}`, {
    method: "DELETE",
  });
}

export async function createConsultationLead(input: CreateLeadInput): Promise<LeadSubmissionResponse> {
  return fetchJson<LeadSubmissionResponse>("/leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAdminLeads(search?: URLSearchParams): Promise<ConsultationLead[]> {
  return fetchJson<ConsultationLead[]>(`/admin/leads${search ? `?${search.toString()}` : ""}`);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<ConsultationLead> {
  return fetchJson<ConsultationLead>(`/admin/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function saveArticle(
  id: string,
  article: Partial<Article>,
): Promise<Article> {
  return fetchJson<Article>(`/admin/articles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(article),
  });
}

export async function updateArticleStatus(
  id: string,
  status: Article["status"],
): Promise<Article> {
  return fetchJson<Article>(`/admin/articles/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getSeoScore(input: SeoInput): Promise<SeoResult> {
  try {
    return await fetchJson<SeoResult>("/seo/score", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch {
    return scoreSeo(input);
  }
}
