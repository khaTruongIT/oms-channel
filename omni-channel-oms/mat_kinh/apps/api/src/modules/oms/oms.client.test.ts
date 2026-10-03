import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmsClient } from "./oms.client";

describe("OmsClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    process.env = {
      ...originalEnv,
      OMS_SYNC_ENABLED: "true",
      OMS_API_BASE_URL: "http://oms.local/api/v1",
      OMS_SERVICE_EMAIL: "service@optiqis.vn",
      OMS_SERVICE_PASSWORD: "secret-password",
      OMS_TENANT_ID: "tenant-1",
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it("logs in once and sends bearer plus tenant headers to OMS", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-token" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OmsClient();
    await client.getProducts();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://oms.local/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://oms.local/api/v1/products",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer access-token",
          "x-tenant-id": "tenant-1",
        }),
      }),
    );
  });
});
