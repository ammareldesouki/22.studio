import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';

/**
 * Resolve the JWT signing secret. Required in every environment except local dev,
 * where an insecure placeholder is allowed. Never ship a hardcoded prod secret.
 */
function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV !== 'production' ? 'dev-only-insecure-secret' : undefined);
  if (!secret) {
    throw new Error('JWT_SECRET env var is required in production.');
  }
  return new TextEncoder().encode(secret);
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Hashing ──────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

// ── Access tokens ────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  userId: string;
  roleId: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload as unknown as AccessTokenPayload;
}

// ── Refresh tokens ───────────────────────────────────────────────────────

export interface RefreshTokenRecord {
  id: string;
  hashedToken: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
}

// ── Storage interface (implemented by the repository) ────────────────────

export interface RefreshTokenStore {
  create(token: RefreshTokenRecord): Promise<void>;
  findByHash(hashedToken: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
