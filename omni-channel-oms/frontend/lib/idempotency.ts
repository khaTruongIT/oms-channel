export function createIdempotencyKey(prefix: string): string {
  const normalizedPrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${normalizedPrefix || "request"}-${random}`;
}

