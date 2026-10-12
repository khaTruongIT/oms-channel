import { describe, it, expect } from "vitest";
import { checkRolePermission } from "./usePermission";
import { UserRole } from "./useTenantMembers";

describe("checkRolePermission", () => {
  it("allows all owner-only actions for OWNER", () => {
    expect(checkRolePermission(UserRole.OWNER, "invite_member")).toBe(true);
    expect(checkRolePermission(UserRole.OWNER, "resend_invite")).toBe(true);
    expect(checkRolePermission(UserRole.OWNER, "cancel_invite")).toBe(true);
    expect(checkRolePermission(UserRole.OWNER, "remove_member")).toBe(true);
    expect(checkRolePermission(UserRole.OWNER, "change_role")).toBe(true);
  });

  it("denies owner-only actions for WAREHOUSE_MANAGER", () => {
    expect(checkRolePermission(UserRole.WAREHOUSE_MANAGER, "invite_member")).toBe(false);
    expect(checkRolePermission(UserRole.WAREHOUSE_MANAGER, "resend_invite")).toBe(false);
    expect(checkRolePermission(UserRole.WAREHOUSE_MANAGER, "cancel_invite")).toBe(false);
    expect(checkRolePermission(UserRole.WAREHOUSE_MANAGER, "remove_member")).toBe(false);
  });

  it("denies owner-only actions for SALES_STAFF", () => {
    expect(checkRolePermission(UserRole.SALES_STAFF, "invite_member")).toBe(false);
    expect(checkRolePermission(UserRole.SALES_STAFF, "resend_invite")).toBe(false);
    expect(checkRolePermission(UserRole.SALES_STAFF, "remove_member")).toBe(false);
  });

  it("denies access when role is null or undefined", () => {
    expect(checkRolePermission(null, "invite_member")).toBe(false);
    expect(checkRolePermission(undefined, "invite_member")).toBe(false);
  });
});
