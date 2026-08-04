'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

// Public review submission form. Mirrors the contact form: honeypot for bots, posts to the
// site's /api/reviews endpoint. Submissions go live immediately, then refreshes the page so
// the new card appears with the others.
export function ReviewForm() {
  const t = useTranslations('reviewForm');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          authorName: fd.get('authorName'),
          email: fd.get('email'),
          quote: fd.get('quote'),
          company: fd.get('company'),
          locale,
        }),
      });
      if (res.ok) {
        setStatus('sent');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <p className="font-display text-[clamp(18px,2vw,24px)] font-medium text-fg-strong">{t('sent')}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col gap-4 sm:flex-row">
        <input name="authorName" required maxLength={120} placeholder={t('name')} className="input sm:flex-1" />
        <input name="email" type="email" required maxLength={200} placeholder={t('email')} className="input sm:flex-1" />
      </div>
      <textarea name="quote" required rows={4} maxLength={1000} placeholder={t('quote')} className="input resize-none" />
      <button type="submit" disabled={status === 'sending'} className="btn btn-red self-start rounded-[2px] disabled:opacity-60" data-cursor="Go">
        {status === 'sending' ? t('submitting') : t('submit')}
      </button>
      {status === 'error' && <p className="text-sm text-red">{t('error')}</p>}
    </form>
  );
}
