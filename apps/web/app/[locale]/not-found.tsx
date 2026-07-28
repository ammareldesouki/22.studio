import { getTranslations } from 'next-intl/server';
import { Link } from '../i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <div className="grid min-h-screen place-items-center pt-32 text-center">
      <div className="wrap">
        <p className="font-display text-[clamp(90px,22vw,260px)] font-extrabold leading-none text-white">404</p>
        <p className="mt-4 text-muted">{t('notFound')}</p>
        <Link href="/" className="btn btn-red mt-8 inline-flex rounded-[2px]" data-cursor="Go">
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
