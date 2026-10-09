import { describe, expect, it } from "vitest";
import { persistAuthSession } from "./auth-session";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key: string): string | null => values.get(key) ?? null,
    removeItem: (key: string): void => {
      values.delete(key);
    },
    setItem: (key: string, value: string): void => {
      values.set(key, value);
    },
  };
}

describe("persistAuthSession", () => {
  it("clears a previous account's tenant context before saving new tokens", () => {
    const storage = createStorage({
      currentTenant: JSON.stringify({ id: "tenant-from-another-account" }),
      token: "old-token",
      refreshToken: "old-refresh-token",
    });

    persistAuthSession(
      {
        access_token: "new-token",
        refresh_token: "new-refresh-token",
      },
      storage,
    );

    expect(storage.getItem("currentTenant")).toBeNull();
    expect(storage.getItem("token")).toBe("new-token");
    expect(storage.getItem("refreshToken")).toBe("new-refresh-token");
  });
});
