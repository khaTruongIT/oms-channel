import { describe, it, expect } from "vitest";
import { buildSalesReportUrl, buildTopSkusUrl } from "./useReports";

describe("useReports URL builders", () => {
  it("builds sales report URL correctly", () => {
    const url = buildSalesReportUrl({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T23:59:59.999Z",
      groupBy: "channel",
    });

    expect(url).toContain("/reports/sales?");
    expect(url).toContain("from=2026-01-01T00%3A00%3A00.000Z");
    expect(url).toContain("to=2026-01-31T23%3A59%3A59.999Z");
    expect(url).toContain("groupBy=channel");
  });

  it("builds top SKUs report URL with limit", () => {
    const url = buildTopSkusUrl({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T23:59:59.999Z",
      limit: 15,
    });

    expect(url).toContain("/reports/top-skus?");
    expect(url).toContain("limit=15");
  });
});
