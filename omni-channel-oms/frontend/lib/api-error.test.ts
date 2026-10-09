import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./api-error";

describe("getApiErrorMessage", () => {
  it("returns a validation message from the backend error envelope", () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: ["Password must be at least 8 characters long"],
          },
        },
      },
    };

    expect(getApiErrorMessage(error, "Registration failed")).toBe(
      "Password must be at least 8 characters long",
    );
  });
});
