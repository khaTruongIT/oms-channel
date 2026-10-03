import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { describe, expect, it } from "vitest";
import { AuthService } from "./auth.service";

// Use the same secret as the demo fallback so tests work without env vars
const JWT_SECRET = "optiqis-demo-secret-change-in-production";

function makeAuthService() {
  const jwtService = new JwtService({ secret: JWT_SECRET, signOptions: { expiresIn: "24h" } });
  return new AuthService(jwtService);
}

describe("AuthService", () => {
  const authService = makeAuthService();

  it("authenticates valid user with correct password", async () => {
    const res = await authService.login({
      email: "admin@optiqis.vn",
      password: "optiqis2026",
    });

    expect(res.user.email).toBe("admin@optiqis.vn");
    expect(res.user.role).toBe("ADMIN");
    // Token should be a valid JWT (3 dot-separated segments)
    expect(res.token.split(".")).toHaveLength(3);
  });

  it("rejects non-existent email", async () => {
    await expect(
      authService.login({
        email: "unknown@optiqis.vn",
        password: "optiqis2026",
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects wrong password", async () => {
    await expect(
      authService.login({
        email: "admin@optiqis.vn",
        password: "wrongpassword",
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("validates generated token payload", async () => {
    const loginRes = await authService.login({
      email: "editor@optiqis.vn",
      password: "optiqis2026",
    });

    const user = await authService.validateToken(loginRes.token);
    expect(user.email).toBe("editor@optiqis.vn");
    expect(user.role).toBe("EDITOR");
  });

  it("rejects malformed token", async () => {
    await expect(authService.validateToken("bad_token_123")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("rejects token signed with wrong secret", async () => {
    const badJwt = new JwtService({ secret: "wrong-secret" });
    const token = await badJwt.signAsync({ sub: "user-admin-1", email: "admin@optiqis.vn", role: "ADMIN" });
    await expect(authService.validateToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
