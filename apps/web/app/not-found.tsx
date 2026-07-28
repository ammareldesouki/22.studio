import '../app/globals.css';

// Global fallback for requests that don't match a locale (the middleware normally redirects
// to /en). It renders its own <html> because it sits outside the [locale] root layout.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-ink text-white">
        <div className="text-center">
          <p className="font-display text-6xl font-extrabold">404</p>
          <a href="/en" className="mt-4 inline-block text-red">
            Back to 22 Studio
          </a>
        </div>
      </body>
    </html>
  );
}
