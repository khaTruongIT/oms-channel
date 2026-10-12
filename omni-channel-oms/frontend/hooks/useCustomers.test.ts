import { describe, it, expect } from "vitest";
import {
  buildCustomersUrl,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./useCustomers";

describe("useCustomers helpers", () => {
  it("builds query URL correctly with defaults and parameters", () => {
    expect(buildCustomersUrl()).toBe("/customers");

    const url = buildCustomersUrl({
      page: 2,
      limit: 10,
      q: "0901234567",
      sortBy: "total_spent",
      sortOrder: "DESC",
    });

    expect(url).toBe(
      "/customers?page=2&limit=10&q=0901234567&sortBy=total_spent&sortOrder=DESC",
    );
  });

  it("trims search query and ignores empty values", () => {
    const url = buildCustomersUrl({
      q: "   Nguyễn Văn A   ",
    });

    expect(url).toBe("/customers?q=Nguy%E1%BB%85n+V%C4%83n+A");
  });

  it("rejects manual customer mutations because customers are derived from orders", async () => {
    await expect(createCustomer({ fullName: "Test" })).rejects.toThrow(
      /tổng hợp tự động từ đơn hàng/,
    );
    await expect(updateCustomer("123", { fullName: "Test" })).rejects.toThrow(
      /tổng hợp tự động từ đơn hàng/,
    );
    await expect(deleteCustomer("123")).rejects.toThrow(
      /tổng hợp tự động từ đơn hàng/,
    );
  });
});
