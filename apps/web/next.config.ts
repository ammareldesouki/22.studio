import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@studioflow/shared',
    '@studioflow/types',
    '@studioflow/ui',
  ],
};

export default nextConfig;
