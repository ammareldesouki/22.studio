// The admin is served under /admin (Next.js Multi-Zones): the public site (apps/web)
// rewrites /admin/* to this deployment, and this app runs with basePath '/admin'.
//
// basePath auto-prefixes next/link + next/navigation, but NOT fetch() calls or manually
// built Set-Cookie paths — those must include BASE_PATH explicitly. Keep this value in
// sync with `basePath` in next.config.ts.
export const BASE_PATH = '/admin';

// Refresh-token cookie is scoped to the auth endpoints, which live under the basePath.
export const AUTH_COOKIE_PATH = `${BASE_PATH}/api/auth`;
