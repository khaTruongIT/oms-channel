import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildInventoryUrl,
  buildMovementsUrl,
  adjustStock,
  transferStock,
  updateSafetyStock,
} from "./useInventory";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("useInventory helpers and API actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildInventoryUrl", () => {
    it("builds query with all filters", () => {
      const url = buildInventoryUrl({
        warehouseId: "wh-1",
        masterSkuId: "sku-1",
        lowStock: true,
        q: "Widget",
        page: 2,
        limit: 25,
      });

      expect(url).toContain("/inventory?");
      expect(url).toContain("warehouseId=wh-1");
      expect(url).toContain("masterSkuId=sku-1");
      expect(url).toContain("lowStock=true");
      expect(url).toContain("q=Widget");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=25");
    });

    it("returns plain /inventory when no filters provided", () => {
      expect(buildInventoryUrl()).toBe("/inventory");
    });
  });

  describe("buildMovementsUrl", () => {
    it("builds query with movement ledger filters", () => {
      const url = buildMovementsUrl({
        masterSkuId: "sku-10",
        warehouseId: "wh-2",
        orderId: "ord-99",
        movementType: "TRANSFER_IN",
        from: "2026-01-01",
        to: "2026-01-31",
        page: 1,
        limit: 50,
      });

      expect(url).toContain("/inventory/movements?");
      expect(url).toContain("masterSkuId=sku-10");
      expect(url).toContain("warehouseId=wh-2");
      expect(url).toContain("orderId=ord-99");
      expect(url).toContain("movementType=TRANSFER_IN");
      expect(url).toContain("from=2026-01-01");
      expect(url).toContain("to=2026-01-31");
      expect(url).toContain("page=1");
      expect(url).toContain("limit=50");
    });

    it("returns plain /inventory/movements when no filters provided", () => {
      expect(buildMovementsUrl()).toBe("/inventory/movements");
    });
  });

  describe("adjustStock", () => {
    it("posts to /inventory/adjust", async () => {
      const mockResult = { id: "inv-1", quantity: 50 };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult });

      const res = await adjustStock({
        masterSkuId: "sku-1",
        warehouseId: "wh-1",
        quantity: 10,
        reason: "Stock arrival",
        idempotencyKey: "adj-key-1",
      });

      expect(api.post).toHaveBeenCalledWith("/inventory/adjust", {
        masterSkuId: "sku-1",
        warehouseId: "wh-1",
        quantity: 10,
        reason: "Stock arrival",
        idempotencyKey: "adj-key-1",
      });
      expect(res).toEqual(mockResult);
    });
  });

  describe("transferStock", () => {
    it("posts to /inventory/transfer", async () => {
      const mockResult = {
        source: { id: "inv-1", quantity: 40 },
        destination: { id: "inv-2", quantity: 10 },
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult });

      const res = await transferStock({
        fromWarehouseId: "wh-1",
        toWarehouseId: "wh-2",
        masterSkuId: "sku-1",
        quantity: 10,
        reason: "Rebalance stock",
        idempotencyKey: "trans-key-1",
      });

      expect(api.post).toHaveBeenCalledWith("/inventory/transfer", {
        fromWarehouseId: "wh-1",
        toWarehouseId: "wh-2",
        masterSkuId: "sku-1",
        quantity: 10,
        reason: "Rebalance stock",
        idempotencyKey: "trans-key-1",
      });
      expect(res).toEqual(mockResult);
    });
  });

  describe("updateSafetyStock", () => {
    it("puts to /inventory/safety-stock", async () => {
      const mockResult = { id: "inv-1", safetyStock: 15 };
      vi.mocked(api.put).mockResolvedValueOnce({ data: mockResult });

      const res = await updateSafetyStock({
        masterSkuId: "sku-1",
        warehouseId: "wh-1",
        safetyStock: 15,
      });

      expect(api.put).toHaveBeenCalledWith("/inventory/safety-stock", {
        masterSkuId: "sku-1",
        warehouseId: "wh-1",
        safetyStock: 15,
      });
      expect(res).toEqual(mockResult);
    });
  });
});
