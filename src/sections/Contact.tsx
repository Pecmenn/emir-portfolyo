import { useState, type FormEvent } from 'react';
import { contact, site } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import { useLang } from '../lib/i18n';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Contact() {
  const { t, lang } = useLang();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!site.formEndpoint) {
      // Form servisi tanımlı değilse e-posta uygulamasında hazır taslak aç
      const subject = encodeURIComponent(`${data.get('name')} — Portfolyo`);
      const body = encodeURIComponent(`${data.get('message')}\n\n${data.get('name')} <${data.get('email')}>`);
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(site.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      setStatus(res.ok ? 'sent' : 'error');
      if (res.ok) e.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  };

  const field =
    'w-full border-b border-ink/20 bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-mute focus:border-ink';

  return (
    <section id="iletisim" className="gutter bg-paper pb-[16vh] pt-[14vh]">
      <p className="mb-8 text-sm font-medium text-mute">{t(contact.label)}</p>
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <Lines key={lang} lines={contact.title[lang]} className="display text-[clamp(3.2rem,9vw,8.5rem)]" />
          <FadeUp className="mt-10 max-w-md">
            <p className="text-lg leading-relaxed">{t(contact.text)}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={`mailto:${site.email}`} className="display text-2xl underline decoration-1 underline-offset-8 hover:text-accent">
                {site.email}
              </a>
              <button onClick={copy} className="pill border-ink/70 hover:bg-ink hover:text-paper" aria-live="polite">
                {copied ? t(contact.copied) : t(contact.copy)}
              </button>
            </div>
            <div className="mt-8 flex gap-5 text-sm font-medium">
              {site.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-accent">
                  {s.label} ↗
                </a>
              ))}
            </div>
          </FadeUp>
        </div>

        <FadeUp className="lg:pt-6">
          <form onSubmit={submit} className="flex flex-col gap-6">
            <label className="sr-only" htmlFor="name">
              {t(contact.form.name)}
            </label>
            <input id="name" name="name" required placeholder={t(contact.form.name)} className={field} autoComplete="name" />
            <label className="sr-only" htmlFor="email">
              {t(contact.form.email)}
            </label>
            <input id="email" name="email" type="email" required placeholder={t(contact.form.email)} className={field} autoComplete="email" />
            <label className="sr-only" htmlFor="message">
              {t(contact.form.message)}
            </label>
            <textarea id="message" name="message" required rows={5} placeholder={t(contact.form.message)} className={`${field} resize-none`} />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="pill border-ink bg-ink px-6 py-3 text-base text-paper hover:border-accent hover:bg-accent hover:text-ink disabled:opacity-50"
              >
                {status === 'sending' ? t(contact.form.sending) : t(contact.form.send)} <span aria-hidden>→</span>
              </button>
              <p className="text-sm" role="status">
                {status === 'sent' && t(contact.form.sent)}
                {status === 'error' && t(contact.form.error)}
              </p>
            </div>
          </form>
        </FadeUp>
      </div>
    </section>
  );
}
