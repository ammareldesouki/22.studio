import { Link } from '../app/i18n/navigation';

// A link whose href may come from the CMS: absolute http(s) → external anchor,
// otherwise an internal locale-aware Link.
export function CmsLink({
  href,
  className,
  cursor,
  children,
}: {
  href: string;
  className?: string;
  cursor?: string;
  children: React.ReactNode;
}) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer" data-cursor={cursor}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} data-cursor={cursor}>
      {children}
    </Link>
  );
}
