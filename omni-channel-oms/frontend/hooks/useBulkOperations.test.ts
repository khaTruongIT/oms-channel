import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dryRunBulkJob,
  startBulkJob,
  getBulkJobStatus,
  bulkDeleteProducts,
} from "./useBulkOperations";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("useBulkOperations API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call POST /bulk-jobs with dryRun=true on dryRunBulkJob", async () => {
    const mockRes = {
      data: {
        valid: true,
        summary: { total: 2, validCount: 2, invalidCount: 0 },
        errors: [],
        dryRun: true,
      },
    };
    (api.post as any).mockResolvedValueOnce(mockRes);

    const rows = [{ sku: "SKU-1", name: "Product 1", price: "100" }];
    const res = await dryRunBulkJob("PRODUCT_IMPORT", rows);

    expect(api.post).toHaveBeenCalledWith("/bulk-jobs", {
      type: "PRODUCT_IMPORT",
      rows,
      dryRun: true,
    });
    expect(res.valid).toBe(true);
  });

  it("should call POST /bulk-jobs with rows and idempotency key on startBulkJob", async () => {
    const mockRes = {
      data: {
        id: "job-123",
        type: "INVENTORY_IMPORT",
        status: "PROCESSING",
        total: 10,
        processed: 0,
        failed: 0,
      },
    };
    (api.post as any).mockResolvedValueOnce(mockRes);

    const rows = [{ sku: "SKU-1", warehouse: "wh-1", quantity: 50 }];
    const res = await startBulkJob("INVENTORY_IMPORT", rows, "idemp-key-1");

    expect(api.post).toHaveBeenCalledWith("/bulk-jobs", {
      type: "INVENTORY_IMPORT",
      rows,
      idempotencyKey: "idemp-key-1",
    });
    expect(res.id).toBe("job-123");
  });

  it("should call GET /bulk-jobs/:id on getBulkJobStatus", async () => {
    const mockRes = {
      data: {
        id: "job-123",
        status: "COMPLETED",
        total: 10,
        processed: 10,
        failed: 0,
        error_report: [],
      },
    };
    (api.get as any).mockResolvedValueOnce(mockRes);

    const res = await getBulkJobStatus("job-123");
    expect(api.get).toHaveBeenCalledWith("/bulk-jobs/job-123");
    expect(res.status).toBe("COMPLETED");
  });

  it("should call POST /bulk-jobs with PRODUCT_DELETE rows on bulkDeleteProducts", async () => {
    const mockRes = {
      data: {
        id: "job-del-1",
        status: "COMPLETED",
        total: 2,
        processed: 2,
        failed: 0,
      },
    };
    (api.post as any).mockResolvedValueOnce(mockRes);

    const res = await bulkDeleteProducts(["SKU-A", "SKU-B"]);
    expect(api.post).toHaveBeenCalledWith("/bulk-jobs", {
      type: "PRODUCT_DELETE",
      rows: [{ sku: "SKU-A" }, { sku: "SKU-B" }],
    });
    expect(res.id).toBe("job-del-1");
  });
});
