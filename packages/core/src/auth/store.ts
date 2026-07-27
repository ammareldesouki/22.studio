import { db } from '@studioflow/db';
import { type RefreshTokenStore, type RefreshTokenRecord } from '.';

export const refreshTokenStore: RefreshTokenStore = {
  async create(record: RefreshTokenRecord): Promise<void> {
    await db.refreshToken.create({
      data: {
        hashedToken: record.hashedToken,
        userId: record.userId,
        expiresAt: record.expiresAt,
      },
    });
  },

  async findByHash(hashed: string): Promise<RefreshTokenRecord | null> {
    const row = await db.refreshToken.findFirst({
      where: { hashedToken: hashed, revoked: false, expiresAt: { gt: new Date() } },
    });
    if (!row) return null;
    return {
      id: row.id,
      hashedToken: row.hashedToken,
      userId: row.userId,
      expiresAt: row.expiresAt,
      revoked: row.revoked,
    };
  },

  async revoke(id: string): Promise<void> {
    await db.refreshToken.update({ where: { id }, data: { revoked: true } });
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await db.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  },
};
