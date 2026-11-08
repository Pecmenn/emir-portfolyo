import { useRef, useState, type FormEvent } from 'react';
import { contact, cvUrl, site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { useSoftReveal } from '../lib/reveal';
import SocialIcon from '../components/SocialIcon';

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
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useSoftReveal(sectionRef);

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
    'w-full border-b bg-transparent py-2.5 text-[17px] text-cream lg:text-base xl:text-[17px] outline-none transition-colors placeholder:text-stone/70 focus:border-wine-light focus-visible:outline-none';
  const labelClass = 'block text-[13px] tracking-[0.04em] text-stone';

  const fieldProps = (name: FieldName) => ({
    id: name,
    name,
    required: true,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    className: `${field} ${errors[name] ? 'border-wine-light' : 'border-seam'}`,
    onBlur: onBlur(name),
  });
  const error = (name: FieldName) =>
    errors[name] ? (
      <p id={`${name}-error`} role="alert" className="mt-1.5 text-sm font-medium text-wine-light">
        {errors[name]}
      </p>
    ) : null;

  const mailLink = (
    <a href={`mailto:${site.email}`} className="font-semibold underline underline-offset-4">
      {site.email}
    </a>
  );
  const lines = contact.title[lang];

  // Geniş ekranda tek ızgara: iki sütun, iki satır. Üstte solda başlık, sağda form (ad ve e-posta yan yana); formun üstü
  // başlığın tepesiyle, Gönder düğmesi başlığın alt çizgisiyle hizalı, aradaki boşluğu mesaj kutusu doldurur. Altta tam genişlikte çizgi; altında solda
  // e-posta ve sosyal hesaplar, sağda e-postanın tam karşısında CV düğmesi (panelden CV yüklüyse). Telefonda alt alta
  const emailRow = t(contact.text) ? 'lg:row-start-3' : 'lg:row-start-2';
  return (
    <section ref={sectionRef} id="iletisim" className="gutter grid scroll-mt-[92px] gap-10 pb-[clamp(80px,11vw,140px)] lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-[clamp(48px,6vw,120px)] lg:gap-y-[clamp(40px,4.5vw,64px)]">
      <h2 data-reveal className="display text-[clamp(4rem,14vw,13.5rem)] lg:text-[clamp(8rem,11.5vw,13.5rem)]" aria-label={lines.join(' ')}>
        {lines.map((line, i) => (
          <span key={`${line}-${i}`} aria-hidden className="line-mask soft-line">
            <span className={i === lines.length - 1 ? 'text-wine-bright' : ''}>{line}</span>
          </span>
        ))}
      </h2>
      <div className="soft-rise [transition-delay:.1s] lg:flex lg:flex-col">
        {status === 'sent' ? (
          <div ref={resultRef} tabIndex={-1} role="status" className="rounded-2xl border border-seam bg-coal-2 p-6 text-lg leading-relaxed outline-none">
            {t(contact.form.sent)}
          </div>
        ) : (
          <form ref={formRef} onSubmit={submit} noValidate aria-busy={status === 'sending'} className="grid gap-5 lg:flex-1 lg:grid-cols-2 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:gap-x-4 lg:gap-y-4 xl:gap-x-6">
            <div className="grid gap-2">
              <label htmlFor="name" className={labelClass}>
                {t(contact.form.name)}
              </label>
              <input {...fieldProps('name')} placeholder={t(contact.form.phName)} autoComplete="name" />
              {error('name')}
            </div>
            <div className="grid gap-2">
              <label htmlFor="email" className={labelClass}>
                {t(contact.form.email)}
              </label>
              <input {...fieldProps('email')} type="email" inputMode="email" placeholder={t(contact.form.phEmail)} autoComplete="email" />
              {error('email')}
            </div>
            <div className="grid gap-2 lg:col-span-2 lg:min-h-0 lg:grid-rows-[auto_minmax(3.5rem,1fr)_auto]">
              <label htmlFor="message" className={labelClass}>
                {t(contact.form.message)}
              </label>
              <textarea {...fieldProps('message')} rows={4} placeholder={t(contact.form.phMessage)} className={`${fieldProps('message').className} resize-y lg:h-full lg:min-h-0 lg:resize-none`} />
              {error('message')}
            </div>
            <div className="relative lg:col-span-2">
              <button type="submit" disabled={status === 'sending'} className="btn btn-wine disabled:opacity-50">
                {status === 'sending' ? t(contact.form.sending) : t(contact.form.send)} <span aria-hidden className="arrow">→</span>
              </button>
              <div role="status" aria-live="polite" className="mt-5 min-h-[1.5rem] text-sm leading-relaxed lg:absolute lg:left-0 lg:top-full lg:mt-3 lg:min-h-0 lg:w-full">
                {status === 'mailto' && (
                  <p>
                    {t(contact.form.mailtoOpened)}
                    <br />
                    {t(contact.form.mailtoNote)} {mailLink}
                  </p>
                )}
                {status === 'error' && (
                  <p className="font-medium text-wine-light">
                    {t(contact.form.error)} <span className="text-cream">{mailLink}</span>
                  </p>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
      <div className="soft-rise border-t border-seam pt-8 lg:col-span-2 lg:grid lg:grid-cols-subgrid lg:content-start [transition-delay:.15s]">
        {t(contact.text) && <p className="mb-8 max-w-md text-stone lg:col-start-1">{t(contact.text)}</p>}
        <p className="eyebrow mb-3.5 lg:col-start-1">{t(contact.form.email)}</p>
        <a
          href={`mailto:${site.email}`}
          className={`break-all border-b border-seam pb-1.5 text-[clamp(1.4rem,2.4vw,2.2rem)] transition-colors hover:border-cream lg:col-start-1 lg:justify-self-start ${emailRow}`}
        >
          {site.email}
        </a>
        <div className="mt-6 flex flex-wrap gap-2.5 lg:col-start-1">
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="btn">
              <SocialIcon href={s.href} label={s.label} className="h-4 w-4" /> {s.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        {cvUrl && (
          <div className={`mt-8 lg:col-start-2 lg:mt-0 lg:self-center ${emailRow}`}>
            <a href={cvUrl} download className="btn btn-wine">
              {t(ui.cv)} <span aria-hidden className="arrow">↓</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
