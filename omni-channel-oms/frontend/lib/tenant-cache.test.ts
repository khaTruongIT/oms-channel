import { describe, expect, it } from "vitest";
import { tenantScopedKey } from "./tenant-cache";

describe("tenantScopedKey", () => {
  it("partitions the same resource for different tenants", () => {
    expect(tenantScopedKey("tenant-a", "/orders")).not.toEqual(
      tenantScopedKey("tenant-b", "/orders"),
    );
  });

  it("does not create a request key until a tenant is selected", () => {
    expect(tenantScopedKey(null, "/orders")).toBeNull();
  });
});
