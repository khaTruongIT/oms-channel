import { describe, it, expect, vi, beforeEach } from "vitest";
import { singleFlightRefreshToken, clearRefreshPromise } from "./api";

function createMockStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, val: string) => store.set(key, val)),
    removeItem: vi.fn((key: string) => store.delete(key)),
  };
}

describe("Single-Flight Refresh Token (S1.2.2)", () => {
  beforeEach(() => {
    clearRefreshPromise();
    vi.clearAllMocks();
  });

  it("coalesces 3 concurrent refresh calls into exactly 1 HTTP request", async () => {
    const storage = createMockStorage({
      token: "old-token",
      refreshToken: "valid-refresh-token",
    });

    let resolveRefresh: (val: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });

    const mockRefreshApi = vi.fn().mockImplementation(() => pendingPromise);

    // Dispatch 3 concurrent refresh requests
    const p1 = singleFlightRefreshToken(storage, mockRefreshApi);
    const p2 = singleFlightRefreshToken(storage, mockRefreshApi);
    const p3 = singleFlightRefreshToken(storage, mockRefreshApi);

    // Verify only 1 HTTP request was dispatched while pending
    expect(mockRefreshApi).toHaveBeenCalledTimes(1);

    // Resolve the HTTP request
    resolveRefresh!({ data: { access_token: "new-access-token" } });

    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);

    expect(t1).toBe("new-access-token");
    expect(t2).toBe("new-access-token");
    expect(t3).toBe("new-access-token");
    expect(mockRefreshApi).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith("token", "new-access-token");
  });

  it("clears storage and fails all concurrent callers when refresh rejects", async () => {
    const storage = createMockStorage({
      token: "old-token",
      refreshToken: "invalid-refresh-token",
      currentTenant: JSON.stringify({ id: "tenant-1" }),
    });

    const mockRefreshApi = vi
      .fn()
      .mockRejectedValue(new Error("Refresh token expired"));

    const p1 = singleFlightRefreshToken(storage, mockRefreshApi);
    const p2 = singleFlightRefreshToken(storage, mockRefreshApi);

    await expect(p1).rejects.toThrow("Refresh token expired");
    await expect(p2).rejects.toThrow("Refresh token expired");

    expect(mockRefreshApi).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).toHaveBeenCalledWith("token");
    expect(storage.removeItem).toHaveBeenCalledWith("refreshToken");
    expect(storage.removeItem).toHaveBeenCalledWith("currentTenant");
  });
});
