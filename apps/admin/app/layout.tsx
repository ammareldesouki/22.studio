import React from 'react';
import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import { SITE_NAME } from '@studioflow/shared';
import { AuthProvider } from '../components/auth-provider';
import './globals.css';

const display = Montserrat({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' });
const body = Open_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = {
  title: `${SITE_NAME} · Studio CMS`,
  description: 'StudioFlow administration panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
