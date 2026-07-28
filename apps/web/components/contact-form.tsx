'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export function ContactForm() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          message: fd.get('message'),
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
    return <p className="font-display text-[clamp(22px,2.4vw,32px)] font-medium text-white">{t('sent')}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-6">
      <input name="name" required maxLength={200} placeholder={t('name')} className="input" />
      <input name="email" type="email" required placeholder={t('email')} className="input" />
      <textarea name="message" required rows={5} maxLength={2000} placeholder={t('message')} className="input resize-none" />
      <button type="submit" disabled={status === 'sending'} className="btn btn-red self-start rounded-[2px] disabled:opacity-60" data-cursor="Go">
        {status === 'sending' ? t('sending') : t('send')}
      </button>
      {status === 'error' && <p className="text-sm text-red">{t('error')}</p>}
    </form>
  );
}
