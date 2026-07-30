// Passthrough root layout. The real <html>/<body> live in [locale]/layout.tsx (which needs
// the locale to set lang/dir) and in the global app/not-found.tsx. Next.js 15 still requires
// a root layout to exist for the top-level not-found page — this satisfies that without
// wrapping locale routes in a second <html>. See next-intl i18n-routing setup.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
