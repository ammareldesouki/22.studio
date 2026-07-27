import { db } from './client';
import { ALL_PERMISSIONS } from '@studioflow/types';

async function main() {
  console.log('Seeding database...');

  const ownerRole = await db.role.upsert({
    where: { name: 'Owner' },
    update: {},
    create: {
      name: 'Owner',
      permissions: [...ALL_PERMISSIONS],
      isOwner: true,
    },
  });
  console.log(`Owner role: ${ownerRole.id}`);

  const ownerEmail = process.env.OWNER_EMAIL ?? 'owner@studioflow.app';
  // Never ship a real default password. Require OWNER_PASSWORD except in local dev.
  const ownerPassword =
    process.env.OWNER_PASSWORD ??
    (process.env.NODE_ENV === 'development' ? 'dev-only-change-me' : undefined);
  if (!ownerPassword) {
    throw new Error(
      'OWNER_PASSWORD env var is required to seed the owner account (only optional when NODE_ENV=development).',
    );
  }

  const { hash } = await import('argon2');
  const passwordHash = await hash(ownerPassword);

  const ownerUser = await db.user.upsert({
    where: { email: ownerEmail },
    update: { roleId: ownerRole.id, active: true },
    create: {
      name: 'Studio Owner',
      email: ownerEmail,
      passwordHash,
      roleId: ownerRole.id,
      active: true,
    },
  });
  console.log(`Owner user: ${ownerUser.id} (${ownerEmail})`);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
