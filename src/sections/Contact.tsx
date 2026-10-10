import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { contact, site } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion } from '../lib/scroll';

// idle: bekliyor; sending: form servisine gönderiliyor; sent: servis kabul etti;
// mailto: form adresi tanımlı değil, e-posta taslağı hazırlandı; error: gönderilemedi
type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';
type FieldName = 'name' | 'email' | 'message';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Contact() {
  const { t, lang } = useLang();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Başlık kendi yerinden başlar ve kaydırdıkça aşağı iner; sayfa sonunda alt kenarı
  // formun alt kenarıyla hizalanır (geniş ekranlarda)
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 640px)', () => {
      const head = headRef.current!;
      // Başlığın o anki kaydırma payı çıkarılarak, yerindeyken formun altına ne kadar uzak olduğu ölçülür.
      // Altbilgiye yapışmasın diye küçük bir pay (0.12em) bırakılır.
      const endY = () => {
        const title = head.querySelector('.display');
        const form = head.nextElementSibling;
        if (!title || !form) return 0;
        const offset = Number(gsap.getProperty(head, 'y')) || 0;
        const gap = parseFloat(getComputedStyle(title).fontSize) * 0.12;
        return Math.max(0, form.getBoundingClientRect().bottom - (title.getBoundingClientRect().bottom - offset) - gap);
      };
      gsap.fromTo(
        headRef.current,
        { y: 0 },
        {
          y: endY,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            endTrigger: 'footer',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    });
    return () => mm.revert();
  }, []);

  const validate = (name: FieldName, value: string): string => {
    if (!value.trim()) return t(contact.form.required);
    if (name === 'email' && !EMAIL_RE.test(value.trim())) return t(contact.form.emailInvalid);
    return '';
  };

  const onBlur = (name: FieldName) => (e: { currentTarget: { value: string } }) => {
    const message = validate(name, e.currentTarget.value);
    setErrors((prev) => ({ ...prev, [name]: message || undefined }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Partial<Record<FieldName, string>> = {};
    (['name', 'email', 'message'] as const).forEach((name) => {
      const message = validate(name, String(data.get(name) ?? ''));
      if (message) next[name] = message;
    });
    setErrors(next);
    const firstInvalid = (['name', 'email', 'message'] as const).find((name) => next[name]);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }

    if (!site.formEndpoint) {
      // Form servisi tanımlı değilse doldurulmuş bir e-posta taslağı açılır
      const subject = encodeURIComponent(`${data.get('name')} — Portfolyo`);
      const body = encodeURIComponent(`${data.get('message')}\n\n${data.get('name')} <${data.get('email')}>`);
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
      setStatus('mailto');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(site.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (res.ok) {
        form.reset();
        setStatus('sent');
        // Form yerini teşekkür kartına bırakır; odak kartta kalsın
        window.setTimeout(() => resultRef.current?.focus(), 0);
      } else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  const field =
    'w-full border-b bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-mute-ink focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-strong';
  const labelClass = 'mb-1 block text-sm font-medium text-mute-ink';

  const fieldProps = (name: FieldName) => ({
    id: name,
    name,
    required: true,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    className: `${field} ${errors[name] ? 'border-red-700' : 'border-ink/25'}`,
    onBlur: onBlur(name),
  });
  const error = (name: FieldName) =>
    errors[name] ? (
      <p id={`${name}-error`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
        {errors[name]}
      </p>
    ) : null;

  const mailLink = (
    <a href={`mailto:${site.email}`} className="font-semibold underline underline-offset-4">
      {site.email}
    </a>
  );

  return (
    <section
      ref={sectionRef}
      id="iletisim"
      className="gutter bg-paper pb-20 pt-10 sm:flex sm:min-h-[calc(100svh-var(--footer-h,0px))] sm:flex-col sm:justify-center sm:pb-[3vh] sm:pt-20"
    >
      <div className="grid gap-16 lg:grid-cols-2">
        <div ref={headRef}>
          <Lines key={lang} lines={contact.title[lang]} className="display text-[clamp(3.2rem,min(9vw,11vh),8.5rem)]" />
          <FadeUp className="mt-10 max-w-md">
            <p className="text-lg leading-relaxed">{t(contact.text)}</p>
          </FadeUp>
        </div>

        <FadeUp className="lg:pt-6">
          {status === 'sent' ? (
            <div ref={resultRef} tabIndex={-1} role="status" className="rounded-xl border border-ink/15 bg-white/60 p-6 text-lg leading-relaxed outline-none">
              {t(contact.form.sent)}
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate aria-busy={status === 'sending'} className="flex flex-col gap-6">
              <div>
                <label htmlFor="name" className={labelClass}>
                  {t(contact.form.name)}
                </label>
                <input {...fieldProps('name')} placeholder={t(contact.form.phName)} autoComplete="name" />
                {error('name')}
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  {t(contact.form.email)}
                </label>
                <input {...fieldProps('email')} type="email" inputMode="email" placeholder={t(contact.form.phEmail)} autoComplete="email" />
                {error('email')}
              </div>
              <div>
                <label htmlFor="message" className={labelClass}>
                  {t(contact.form.message)}
                </label>
                <textarea {...fieldProps('message')} rows={5} placeholder={t(contact.form.phMessage)} className={`${fieldProps('message').className} resize-none`} />
                {error('message')}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="pill min-h-11 border-ink bg-ink px-6 py-3 text-base text-paper hover:border-accent hover:bg-accent hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-strong disabled:opacity-50"
                >
                  {status === 'sending' ? t(contact.form.sending) : t(contact.form.send)} <span aria-hidden>→</span>
                </button>
              </div>
              <div role="status" aria-live="polite" className="min-h-[1.5rem] text-sm leading-relaxed">
                {status === 'mailto' && (
                  <p>
                    {t(contact.form.mailtoOpened)}
                    <br />
                    {t(contact.form.mailtoNote)} {mailLink}
                  </p>
                )}
                {status === 'error' && (
                  <p className="font-medium text-red-700">
                    {t(contact.form.error)} <span className="text-ink">{mailLink}</span>
                  </p>
                )}
              </div>
            </form>
          )}
        </FadeUp>
      </div>
    </section>
  );
}
