import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@studioflow/db',
    '@studioflow/shared',
    '@studioflow/types',
    '@studioflow/ui',
    '@studioflow/validation',
  ],
};

export default nextConfig;
