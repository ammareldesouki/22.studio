import path from 'path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

const r2Host = (() => {
  try {
    return new URL(process.env.R2_PUBLIC_URL ?? '').hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@studioflow/shared',
    '@studioflow/types',
    '@studioflow/ui',
    '@studioflow/core',
    '@studioflow/db',
    '@studioflow/validation',
  ],
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  images: {
    remotePatterns: [
      ...(r2Host ? [{ protocol: 'https' as const, hostname: r2Host }] : []),
      { protocol: 'https' as const, hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https' as const, hostname: '**.r2.dev' },
    ],
  },
};

export default withNextIntl(nextConfig);
