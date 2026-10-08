// ============================================================
// Token Encryption Utility
// ============================================================
// Encrypts OAuth access/refresh tokens before storing them in
// PocketBase. Uses AES-256-GCM.
//
// The encryption key comes from TOKEN_ENCRYPTION_KEY env var.
// If not set, a warning is logged but tokens are still encrypted
// with a derived key (NOT for production — set the env var!).
// ============================================================

import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const envKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (envKey && envKey.length >= 32) {
    // Use the env key directly (first 32 bytes)
    cachedKey = Buffer.from(envKey.slice(0, 32), "utf-8");
  } else if (envKey) {
    // Derive a key from a shorter passphrase
    cachedKey = scryptSync(envKey, "nexus-salt", 32);
  } else {
    // Dev fallback — NOT for production
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY must be set in production. Generate one with: openssl rand -hex 32",
      );
    }
    console.warn("[security] TOKEN_ENCRYPTION_KEY not set — using dev fallback key. NOT for production!");
    cachedKey = scryptSync("nexus-dev-key-not-for-production", "nexus-salt", 32);
  }

  return cachedKey;
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf-8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  // Format: iv:tag:encrypted (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}

/**
 * Check if a string looks like it's been encrypted (has the iv:tag:data format).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}
