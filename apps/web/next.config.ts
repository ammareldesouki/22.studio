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
  // Prisma's query-engine .node binary is loaded dynamically, so Next's tracer can't detect it
  // and it gets left out of the serverless bundle ("Query Engine not found" at runtime). Force
  // the whole generated client dir (engine included) into every function bundle.
  outputFileTracingIncludes: {
    '/**/*': ['../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*'],
  },
  transpilePackages: [
    '@studioflow/shared',
    '@studioflow/types',
    '@studioflow/ui',
    '@studioflow/core',
    '@studioflow/db',
    '@studioflow/validation',
  ],
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  // Multi-Zones: serve the admin CMS under /admin on this same domain by proxying to the
  // admin deployment. Set ADMIN_URL to the admin app's URL (e.g. https://22studio-admin.vercel.app,
  // or http://localhost:3001 in dev). Without it, /admin simply 404s here.
  async rewrites() {
    const admin = process.env.ADMIN_URL?.replace(/\/$/, '');
    if (!admin) return [];
    return [
      { source: '/admin', destination: `${admin}/admin` },
      { source: '/admin/:path*', destination: `${admin}/admin/:path*` },
    ];
  },
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
