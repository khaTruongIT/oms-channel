import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth-validation";

describe("authentication form validation", () => {
  it("rejects passwords that the registration API will reject", () => {
    const result = registerSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "secret",
      confirmPassword: "secret",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an eight-character password for login and registration", () => {
    expect(
      loginSchema.safeParse({ email: "ada@example.com", password: "secret12" })
        .success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        password: "secret12",
        confirmPassword: "secret12",
      }).success,
    ).toBe(true);
  });
});
