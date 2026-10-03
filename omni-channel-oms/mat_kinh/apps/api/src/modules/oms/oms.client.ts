import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  OmsAdjustInventoryInput,
  OmsInventoryItem,
  OmsMasterSku,
  OmsProductCreateInput,
  OmsProductUpdateInput,
  OmsStatus,
  OmsStatusCheck,
  OmsWarehouse,
} from "./oms.types";

interface OmsAuthResponse {
  access_token: string;
}

interface OmsRuntimeConfig {
  enabled: boolean;
  apiBaseUrl: string;
  serviceEmail: string;
  servicePassword: string;
  tenantId: string;
  requestTimeoutMs: number;
}

function getConfig(): OmsRuntimeConfig {
  const enabled = process.env.OMS_SYNC_ENABLED === "true";

  return {
    enabled,
    apiBaseUrl: process.env.OMS_API_BASE_URL?.replace(/\/$/, "") ?? "",
    serviceEmail: process.env.OMS_SERVICE_EMAIL ?? "",
    servicePassword: process.env.OMS_SERVICE_PASSWORD ?? "",
    tenantId: process.env.OMS_TENANT_ID ?? "",
    requestTimeoutMs: Number(process.env.OMS_REQUEST_TIMEOUT_MS ?? 5000),
  };
}

function pass(message: string): OmsStatusCheck {
  return { ok: true, state: "pass", message };
}

function fail(message: string): OmsStatusCheck {
  return { ok: false, state: "fail", message };
}

function skipped(message: string): OmsStatusCheck {
  return { ok: false, state: "skipped", message };
}

function missingConfigNames(config: OmsRuntimeConfig): string[] {
  return [
    config.apiBaseUrl ? null : "OMS_API_BASE_URL",
    config.serviceEmail ? null : "OMS_SERVICE_EMAIL",
    config.servicePassword ? null : "OMS_SERVICE_PASSWORD",
    config.tenantId ? null : "OMS_TENANT_ID",
  ].filter((name): name is string => typeof name === "string");
}

@Injectable()
export class OmsClient {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  isEnabled(): boolean {
    return getConfig().enabled;
  }

  async getStatus(): Promise<OmsStatus> {
    const config = getConfig();
    const checkedAt = new Date().toISOString();

    if (!config.enabled) {
      return {
        enabled: false,
        state: "disabled",
        message: "OMS integration is disabled.",
        checkedAt,
        checks: {
          configuration: skipped("OMS_SYNC_ENABLED is not true."),
          authentication: skipped("Skipped while OMS is disabled."),
          products: skipped("Skipped while OMS is disabled."),
          warehouses: skipped("Skipped while OMS is disabled."),
        },
      };
    }

    const missingNames = missingConfigNames(config);
    if (missingNames.length > 0) {
      return {
        enabled: true,
        state: "degraded",
        message: "OMS integration is missing required configuration.",
        checkedAt,
        checks: {
          configuration: fail(`Missing ${missingNames.join(", ")}.`),
          authentication: skipped("Skipped because configuration is incomplete."),
          products: skipped("Skipped because configuration is incomplete."),
          warehouses: skipped("Skipped because configuration is incomplete."),
        },
      };
    }

    try {
      await this.getAccessToken(config);
    } catch {
      return {
        enabled: true,
        state: "degraded",
        message: "OMS authentication failed.",
        checkedAt,
        checks: {
          configuration: pass("OMS configuration is present."),
          authentication: fail("Could not authenticate the OMS service account."),
          products: skipped("Skipped because authentication failed."),
          warehouses: skipped("Skipped because authentication failed."),
        },
      };
    }

    const productsCheck = await this.runStatusCheck(
      () => this.getProducts(),
      "Products endpoint is reachable.",
      "Products endpoint is not reachable.",
    );
    const warehousesCheck = await this.runStatusCheck(
      () => this.getWarehouses(),
      "Warehouses endpoint is reachable.",
      "Warehouses endpoint is not reachable.",
    );
    const connected = productsCheck.ok && warehousesCheck.ok;

    return {
      enabled: true,
      state: connected ? "connected" : "degraded",
      message: connected
        ? "OMS integration is connected."
        : "OMS integration is partially unavailable.",
      checkedAt,
      checks: {
        configuration: pass("OMS configuration is present."),
        authentication: pass("OMS service account authenticated."),
        products: productsCheck,
        warehouses: warehousesCheck,
      },
    };
  }

  async getProducts(): Promise<OmsMasterSku[]> {
    return this.request<OmsMasterSku[]>("/products");
  }

  async getProduct(id: string): Promise<OmsMasterSku> {
    return this.request<OmsMasterSku>(`/products/${id}`);
  }

  async createProduct(input: OmsProductCreateInput): Promise<OmsMasterSku> {
    return this.request<OmsMasterSku>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateProduct(id: string, input: OmsProductUpdateInput): Promise<OmsMasterSku> {
    return this.request<OmsMasterSku>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/products/${id}`, { method: "DELETE" });
  }

  async getInventoryByProduct(masterSkuId: string): Promise<OmsInventoryItem[]> {
    return this.request<OmsInventoryItem[]>(`/inventory/product/${masterSkuId}`);
  }

  async getWarehouses(): Promise<OmsWarehouse[]> {
    return this.request<OmsWarehouse[]>("/warehouses");
  }

  async adjustInventory(input: OmsAdjustInventoryInput): Promise<OmsInventoryItem> {
    return this.request<OmsInventoryItem>("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const config = this.assertEnabledConfig();
    const token = await this.getAccessToken(config);
    const response = await this.fetchWithTimeout(`${config.apiBaseUrl}${path}`, config, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-tenant-id": config.tenantId,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(`OMS request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private async getAccessToken(config: OmsRuntimeConfig): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const response = await this.fetchWithTimeout(`${config.apiBaseUrl}/auth/login`, config, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: config.serviceEmail,
        password: config.servicePassword,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException("OMS authentication failed");
    }

    const body = (await response.json()) as OmsAuthResponse;
    this.accessToken = body.access_token;
    this.accessTokenExpiresAt = Date.now() + 14 * 60 * 1000;
    return body.access_token;
  }

  private assertEnabledConfig(): OmsRuntimeConfig {
    const config = getConfig();
    if (!config.enabled) {
      throw new ServiceUnavailableException("OMS integration is disabled");
    }

    if (!config.apiBaseUrl || !config.serviceEmail || !config.servicePassword || !config.tenantId) {
      throw new ServiceUnavailableException("OMS integration is not configured");
    }

    return config;
  }

  private async fetchWithTimeout(
    url: string,
    config: OmsRuntimeConfig,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableException("OMS request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async runStatusCheck(
    operation: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string,
  ): Promise<OmsStatusCheck> {
    try {
      await operation();
      return pass(successMessage);
    } catch {
      return fail(failureMessage);
    }
  }
}
