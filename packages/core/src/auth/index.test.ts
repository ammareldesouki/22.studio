import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken, generateRefreshToken, hashToken, refreshTokenExpiry } from '.';

describe('auth', () => {
  describe('password hashing', () => {
    it('hashes and verifies a password', async () => {
      const pw = 'test-password-123';
      const hashed = await hashPassword(pw);
      expect(hashed).not.toBe(pw);
      await expect(verifyPassword(hashed, pw)).resolves.toBe(true);
      await expect(verifyPassword(hashed, 'wrong')).resolves.toBe(false);
    });
  });

  describe('access tokens', () => {
    it('signs and verifies a token', async () => {
      const payload = { userId: 'u1', roleId: 'r1' };
      const token = await signAccessToken(payload);
      const decoded = await verifyAccessToken(token);
      expect(decoded.userId).toBe('u1');
      expect(decoded.roleId).toBe('r1');
    });
  });

  describe('refresh tokens', () => {
    it('generates unique tokens', () => {
      const t1 = generateRefreshToken();
      const t2 = generateRefreshToken();
      expect(t1).not.toBe(t2);
      expect(t1.length).toBe(96);
    });

    it('hashed token is deterministic', () => {
      const token = 'test-token';
      const h1 = hashToken(token);
      const h2 = hashToken(token);
      expect(h1).toBe(h2);
    });

    it('refreshTokenExpiry returns a future date', () => {
      const expiry = refreshTokenExpiry();
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
