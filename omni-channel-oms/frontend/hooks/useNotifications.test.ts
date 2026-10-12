import { describe, it, expect, vi, beforeEach } from "vitest";
import { markNotificationAsRead, markAllNotificationsAsRead } from "./useNotifications";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("useNotifications API helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call POST /notifications/:id/read on markNotificationAsRead", async () => {
    (api.post as any).mockResolvedValueOnce({ data: { id: "notif-1", read_at: new Date() } });

    const result = await markNotificationAsRead("notif-1");
    expect(api.post).toHaveBeenCalledWith("/notifications/notif-1/read");
    expect(result.id).toBe("notif-1");
  });

  it("should call POST /notifications/read-all on markAllNotificationsAsRead", async () => {
    (api.post as any).mockResolvedValueOnce({ data: { updatedCount: 4 } });

    const result = await markAllNotificationsAsRead();
    expect(api.post).toHaveBeenCalledWith("/notifications/read-all");
    expect(result.updatedCount).toBe(4);
  });
});
