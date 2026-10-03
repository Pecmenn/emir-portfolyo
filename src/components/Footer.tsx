import { ArrowUp, ArrowUpRight, Download } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { contact, site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';
import SocialIcon from './SocialIcon';

function useLocalTime(timeZone: string, lang: string) {
  const format = () =>
    new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date());
  const [time, setTime] = useState(format);
  useEffect(() => {
    setTime(format());
    const id = window.setInterval(() => setTime(format()), 15_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone, lang]);
  return time;
}

// Ad, alt bilginin genişliğini dolduracak kadar büyür; çok yüksek olmaması için ekran yüksekliğiyle de sınırlanır
function useFitWidth(text: string) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [size, setSize] = useState<number>();
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const probe = document.createElement('span');
    probe.className = 'display';
    Object.assign(probe.style, { position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden', whiteSpace: 'nowrap', fontSize: '100px' });
    probe.textContent = text;
    document.body.appendChild(probe);
    const fit = () => {
      const byWidth = (box.clientWidth / Math.max(probe.offsetWidth, 1)) * 100 * 0.97;
      setSize(Math.round(Math.max(48, Math.min(byWidth, window.innerHeight * 0.15))));
    };
    fit();
    document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => {
      observer.disconnect();
      probe.remove();
    };
  }, [text]);
  return { ref, size };
}

function Label({ children }: { children: string }) {
  return <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-mute">{children}</p>;
}

export default function Footer() {
  const { t, lang } = useLang();
  const { goTo } = useTransition();
  const { pathname } = useLocation();
  const time = useLocalTime(site.timeZone, lang);
  const ref = useRef<HTMLElement>(null);
  const name = useFitWidth(site.name);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  // Alt bilginin yüksekliğini CSS değişkeni olarak yayınla; iletişim bölümü bununla birlikte tam bir ekranı doldurur
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty('--footer-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ad, alt bilgi görünür olunca maskenin altından kayarak belirir
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-footer-name]', {
        yPercent: 105,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 75%' },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const go = (id: string) => (pathname === '/' ? scrollToTarget(`#${id}`) : goTo('/', id));
  const sitemap = [
    { id: 'isler', label: ui.nav.work },
    { id: 'hakkimda', label: ui.nav.about },
    { id: 'uzmanlik', label: ui.nav.expertise },
    { id: 'iletisim', label: ui.nav.contact },
  ];

  return (
    <footer ref={ref} data-theme="dark" className="gutter overflow-hidden bg-ink pt-20 text-paper sm:pt-[4vh]">
      <div className="grid gap-12 border-b border-white/10 pb-10 lg:grid-cols-12 lg:gap-8">
        {/* Durum, e-posta ve CV */}
        <div className="lg:col-span-5">
          <p className="display max-w-2xl text-[clamp(2rem,3vw,3.25rem)] leading-[1.02]">{t(ui.available)}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/60">{t(ui.availableNote)}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-4">
            <a
              href={`mailto:${site.email}`}
              className="display break-all text-[clamp(1.25rem,1.9vw,2rem)] underline decoration-white/30 decoration-1 underline-offset-[6px] transition-colors hover:text-accent hover:decoration-accent"
            >
              {site.email}
            </a>
            <button
              onClick={copy}
              aria-live="polite"
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-paper/80 transition-colors hover:border-paper hover:bg-paper hover:text-ink"
            >
              {copied ? t(contact.copied) : t(contact.copy)}
            </button>
            <a
              href={site.cv}
              download
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
            >
              <Download size={16} /> {t(ui.cv)}
            </a>
          </div>
        </div>

        {/* Menü, sosyal ve iletişim */}
        <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
          <div>
            <Label>{t(ui.sitemap)}</Label>
            <ul className="space-y-2.5">
              {sitemap.map((item, i) => (
                <li key={item.id}>
                  <button onClick={() => go(item.id)} className="group flex items-baseline gap-3 text-[15px] transition-colors hover:text-accent">
                    <span className="text-[11px] tabular-nums text-mute">0{i + 1}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">{t(item.label)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>{t(ui.follow)}</Label>
            <ul className="space-y-2.5">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="group flex items-center gap-3 text-[15px] transition-colors hover:text-accent">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-paper/80 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                      <SocialIcon href={s.href} label={s.label} className="h-[18px] w-[18px]" />
                    </span>
                    {s.label}
                    <ArrowUpRight size={14} className="-translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>{t(ui.localTime)}</Label>
            <p className="display text-3xl tabular-nums">{time}</p>
            <p className="text-sm text-paper/60">{site.location}</p>
          </div>
        </div>
      </div>

      {/* Ekran genişliğinde dev ad */}
      <div className="pt-4">
        <p ref={name.ref} className="line-mask display leading-[0.85]" style={name.size ? { fontSize: name.size } : undefined}>
          <span data-footer-name className="block whitespace-nowrap">
            {site.name}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-white/10 py-5 text-xs text-mute">
        <p>
          © {new Date().getFullYear()} {site.name}. {t(ui.rights)}
        </p>
        <button
          onClick={() => scrollToTarget(0)}
          aria-label={t(ui.backToTop)}
          className="group inline-flex items-center gap-2 font-semibold text-paper/70 transition-colors hover:text-paper"
        >
          <span className="hidden sm:inline">{t(ui.backToTop)}</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
            <ArrowUp size={16} />
          </span>
        </button>
      </div>
    </footer>
  );
}
