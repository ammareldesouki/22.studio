import React from 'react';
import type { Metadata } from 'next';
import { SITE_NAME } from '@studioflow/shared';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: 'StudioFlow public site',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
