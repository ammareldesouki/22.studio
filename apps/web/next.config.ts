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
    // R2 hosts are explicit; the wildcards allow images added to the CMS by external link
    // (e.g. a logo or poster URL, or a YouTube thumbnail) to be optimised by next/image.
    remotePatterns: [
      ...(r2Host ? [{ protocol: 'https' as const, hostname: r2Host }] : []),
      { protocol: 'https' as const, hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https' as const, hostname: '**.r2.dev' },
      { protocol: 'https' as const, hostname: '**' },
      { protocol: 'http' as const, hostname: '**' },
    ],
  },
};

export default withNextIntl(nextConfig);
