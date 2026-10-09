export type TenantScopedKey = readonly [tenantId: string, resource: string];

export function tenantScopedKey(
  tenantId: string | null,
  resource: string | null,
): TenantScopedKey | null {
  if (!tenantId || !resource) {
    return null;
  }

  return [tenantId, resource];
}
