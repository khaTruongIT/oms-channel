import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildOrdersUrl, updateOrderStatus, bulkUpdateOrderStatus } from "./useOrders";
import api from "@/lib/api";
import type { OrderStatus } from "@/types/orders";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe("useOrders helpers and API actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildOrdersUrl", () => {
    it("builds query with all filters", () => {
      const url = buildOrdersUrl({
        channel: "shopee",
        status: "PENDING" as OrderStatus,
        externalOrderId: "EXT-123",
        channelAccountId: "acc-456",
        q: "John",
        page: 2,
        limit: 25,
        sort: "createdAt:desc",
      });

      expect(url).toContain("/orders?");
      expect(url).toContain("channel=shopee");
      expect(url).toContain("status=PENDING");
      expect(url).toContain("externalOrderId=EXT-123");
      expect(url).toContain("channelAccountId=acc-456");
      expect(url).toContain("q=John");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=25");
      expect(url).toContain("sort=createdAt%3Adesc");
    });

    it("returns plain /orders when no filters or ALL status provided", () => {
      expect(buildOrdersUrl()).toBe("/orders");
      expect(buildOrdersUrl({ status: "ALL" })).toBe("/orders");
    });
  });

  describe("updateOrderStatus", () => {
    it("sends status and optional cancel reason", async () => {
      vi.mocked(api.put).mockResolvedValueOnce({
        data: { id: "order-1", status: "CANCELLED", cancelReason: "Customer requested" },
      });

      const res = await updateOrderStatus("order-1", "CANCELLED", "Customer requested");

      expect(api.put).toHaveBeenCalledWith("/orders/order-1/status", {
        status: "CANCELLED",
        reason: "Customer requested",
      });
      expect(res.status).toBe("CANCELLED");
    });

    it("sends status without reason when omitted", async () => {
      vi.mocked(api.put).mockResolvedValueOnce({
        data: { id: "order-1", status: "CONFIRMED" },
      });

      await updateOrderStatus("order-1", "CONFIRMED");

      expect(api.put).toHaveBeenCalledWith("/orders/order-1/status", {
        status: "CONFIRMED",
      });
    });
  });

  describe("bulkUpdateOrderStatus", () => {
    it("posts to /orders/bulk-status with orderIds, status, and optional idempotency key", async () => {
      const mockResult = {
        succeeded: ["ord-1", "ord-2"],
        failed: [],
        total: 2,
        successCount: 2,
        failureCount: 0,
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult });

      const res = await bulkUpdateOrderStatus({
        orderIds: ["ord-1", "ord-2"],
        status: "CONFIRMED",
        idempotencyKey: "test-idem-key",
      });

      expect(api.post).toHaveBeenCalledWith("/orders/bulk-status", {
        orderIds: ["ord-1", "ord-2"],
        status: "CONFIRMED",
        idempotencyKey: "test-idem-key",
      });
      expect(res).toEqual(mockResult);
    });
  });
});
