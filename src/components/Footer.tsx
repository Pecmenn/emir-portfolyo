import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

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

export default function Footer() {
  const { t, lang } = useLang();
  const { goTo } = useTransition();
  const { pathname } = useLocation();
  const time = useLocalTime(site.timeZone, lang);

  const go = (id: string) => (pathname === '/' ? scrollToTarget(`#${id}`) : goTo('/', id));
  const sitemap = [
    { id: 'isler', label: ui.nav.work },
    { id: 'hakkimda', label: ui.nav.about },
    { id: 'uzmanlik', label: ui.nav.expertise },
    { id: 'iletisim', label: ui.nav.contact },
  ];

  return (
    <footer data-theme="dark" className="gutter bg-ink pt-[18vh] text-paper">
      <div className="flex flex-wrap items-end justify-between gap-8 border-b border-white/10 pb-10">
        <p className="display text-[clamp(4rem,14vw,13rem)]">{site.name}</p>
        <div className="sm:text-right">
          <p className="text-sm text-mute">
            {t(ui.localTime)} · {site.location}
          </p>
          <p className="display mt-1 text-3xl tabular-nums">{time}</p>
        </div>
      </div>

      <div className="grid gap-10 py-12 text-sm sm:grid-cols-2">
        <div>
          <p className="mb-4 text-base font-medium">{t(ui.getInTouch)}</p>
          <a href={`mailto:${site.email}`} className="block hover:text-accent">
            {site.email}
          </a>
          <p className="text-mute">{site.location}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-4 text-base font-medium">{t(ui.sitemap)}</p>
            {sitemap.map((item) => (
              <button key={item.id} onClick={() => go(item.id)} className="block py-0.5 hover:text-accent">
                {t(item.label)}
              </button>
            ))}
          </div>
          <div>
            <p className="mb-4 text-base font-medium">{t(ui.follow)}</p>
            {site.socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="block py-0.5 hover:text-accent">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 py-5 text-xs text-mute">
        <button onClick={() => scrollToTarget(0)} className="hover:text-paper">
          ↑ {t(ui.backToTop)}
        </button>
        <p>
          © {new Date().getFullYear()} {site.name}. {t(ui.rights)}
        </p>
      </div>
    </footer>
  );
}
