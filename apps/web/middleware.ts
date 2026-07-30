import createMiddleware from 'next-intl/middleware';
import { routing } from './app/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match everything except API routes, the /admin zone (proxied to the admin app via
  // next.config rewrites — must not get an i18n locale prefix), Next internals, and files
  // with an extension.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
};
