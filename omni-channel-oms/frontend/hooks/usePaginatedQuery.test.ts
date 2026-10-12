import { describe, it, expect } from "vitest";
import {
  buildPaginationQueryString,
  parsePaginationParams,
  extractPaginatedResponse,
} from "./usePaginatedQuery";

describe("usePaginatedQuery utilities", () => {
  describe("buildPaginationQueryString", () => {
    it("should construct query string with page and limit", () => {
      const url = buildPaginationQueryString("/orders", {
        page: 1,
        limit: 20,
      });
      expect(url).toBe("/orders?page=1&limit=20");
    });

    it("should include defined filters and ignore empty/ALL values", () => {
      const url = buildPaginationQueryString("/orders", {
        page: 2,
        limit: 10,
        filters: {
          status: "PENDING",
          channel: "",
          channelAccountId: "acc-123",
          allFilter: "ALL",
          nullable: null,
          undef: undefined,
        },
      });

      expect(url).toContain("page=2");
      expect(url).toContain("limit=10");
      expect(url).toContain("status=PENDING");
      expect(url).toContain("channelAccountId=acc-123");
      expect(url).not.toContain("channel=");
      expect(url).not.toContain("allFilter");
      expect(url).not.toContain("nullable");
      expect(url).not.toContain("undef");
    });

    it("should handle endpoints with pre-existing query params", () => {
      const url = buildPaginationQueryString("/orders?active=true", {
        page: 1,
        limit: 10,
      });
      expect(url).toBe("/orders?active=true&page=1&limit=10");
    });
  });

  describe("parsePaginationParams", () => {
    it("should parse page, limit and filters from URLSearchParams", () => {
      const searchParams = new URLSearchParams("page=3&limit=25&status=PROCESSING&search=test");
      const parsed = parsePaginationParams(searchParams, {
        defaultPage: 1,
        defaultLimit: 10,
        defaultFilters: { status: "ALL", search: "" },
      });

      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(25);
      expect(parsed.filters).toEqual({
        status: "PROCESSING",
        search: "test",
      });
    });

    it("should fallback to defaults on invalid numbers or missing params", () => {
      const searchParams = new URLSearchParams("page=-5&limit=invalid");
      const parsed = parsePaginationParams(searchParams, {
        defaultPage: 1,
        defaultLimit: 20,
        defaultFilters: { status: "ALL" },
      });

      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.filters).toEqual({ status: "ALL" });
    });
  });

  describe("extractPaginatedResponse", () => {
    it("should extract items and meta from standard enveloped response", () => {
      const raw = {
        data: [{ id: "order-1" }, { id: "order-2" }],
        meta: {
          page: 1,
          limit: 10,
          total: 42,
          totalPages: 5,
        },
      };

      const extracted = extractPaginatedResponse(raw, 1, 10);
      expect(extracted.items).toEqual(raw.data);
      expect(extracted.total).toBe(42);
      expect(extracted.totalPages).toBe(5);
    });

    it("should extract items from legacy array response", () => {
      const raw = [{ id: "order-1" }, { id: "order-2" }, { id: "order-3" }];
      const extracted = extractPaginatedResponse(raw, 1, 10);

      expect(extracted.items).toEqual(raw);
      expect(extracted.total).toBe(3);
      expect(extracted.totalPages).toBe(1);
    });

    it("should handle null or undefined responses safely", () => {
      const extracted = extractPaginatedResponse(null, 1, 10);
      expect(extracted.items).toEqual([]);
      expect(extracted.total).toBe(0);
      expect(extracted.totalPages).toBe(1);
    });
  });
});
