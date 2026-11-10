import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

export const CLIENT_INVITE_TTL_DAYS = 7

export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function inviteTokensEqual(rawToken: string, tokenHash: string): boolean {
  const hashed = Buffer.from(hashInviteToken(rawToken), "utf8")
  const expected = Buffer.from(tokenHash, "utf8")
  if (hashed.length !== expected.length) return false
  return timingSafeEqual(hashed, expected)
}

export function inviteExpiresAt(from: Date = new Date()): Date {
  const expires = new Date(from)
  expires.setUTCDate(expires.getUTCDate() + CLIENT_INVITE_TTL_DAYS)
  return expires
}

export function isInviteExpired(expiresAt: string | Date, now: Date = new Date()): boolean {
  const expires = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt
  return expires.getTime() <= now.getTime()
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number."
  }
  return null
}

export function validateEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return "Email is required."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Enter a valid email address."
  }
  return null
}
