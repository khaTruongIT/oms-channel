import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hashes a plaintext password using Node.js crypto scrypt algorithm.
 * Output format: <saltHex>:<hashHex>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored hashed password.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, keyHex] = storedHash.split(":");
    if (!salt || !keyHex) return false;

    const keyBuffer = Buffer.from(keyHex, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
