import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmsClient } from "./oms.client";

describe("OmsClient status", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it("reports disabled without attempting to authenticate", async () => {
    process.env.OMS_SYNC_ENABLED = "false";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const status = await new OmsClient().getStatus();

    expect(status.state).toBe("disabled");
    expect(status.enabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports connected when authentication, products, and warehouses all pass", async () => {
    process.env = {
      ...process.env,
      OMS_SYNC_ENABLED: "true",
      OMS_API_BASE_URL: "http://oms.local/api/v1",
      OMS_SERVICE_EMAIL: "service@optiqis.vn",
      OMS_SERVICE_PASSWORD: "secret-password",
      OMS_TENANT_ID: "tenant-1",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const status = await new OmsClient().getStatus();

    expect(status.state).toBe("connected");
    expect(status.checks.authentication.ok).toBe(true);
    expect(status.checks.products.ok).toBe(true);
    expect(status.checks.warehouses.ok).toBe(true);
  });

  it("reports degraded without leaking service credentials when OMS auth fails", async () => {
    process.env = {
      ...process.env,
      OMS_SYNC_ENABLED: "true",
      OMS_API_BASE_URL: "http://oms.local/api/v1",
      OMS_SERVICE_EMAIL: "service@optiqis.vn",
      OMS_SERVICE_PASSWORD: "secret-password",
      OMS_TENANT_ID: "tenant-1",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("{}", { status: 401 })));

    const status = await new OmsClient().getStatus();

    expect(status.state).toBe("degraded");
    expect(status.checks.authentication.ok).toBe(false);
    expect(JSON.stringify(status)).not.toContain("secret-password");
  });
});
