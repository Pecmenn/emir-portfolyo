import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { lenis, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

const links = [
  { id: 'isler', label: ui.nav.work },
  { id: 'hakkimda', label: ui.nav.about },
  { id: 'uzmanlik', label: ui.nav.expertise },
  { id: 'iletisim', label: ui.nav.contact },
];

// Üst menünün altındaki bölüm koyuysa menü açık renge döner
function useHeaderTheme() {
  const { pathname } = useLocation();
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('');

  useEffect(() => {
    const check = () => {
      const probe = 36;
      const themed = document.querySelectorAll<HTMLElement>('[data-theme]');
      let isDark = false;
      for (const el of themed) {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) isDark = el.dataset.theme === 'dark';
      }
      setDark(isDark);

      let current = '';
      for (const { id } of links) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
      }
      setActive(current);
    };
    check();
    const raf = requestAnimationFrame(check);
    const unsubscribe = lenis.on('scroll', check);
    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener('resize', check);
    };
  }, [pathname]);

  return { dark, active };
}

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { goTo } = useTransition();
  const { pathname } = useLocation();
  const { dark, active } = useHeaderTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const onHome = pathname === '/';

  const go = (id: string) => {
    setMenuOpen(false);
    if (onHome) scrollToTarget(`#${id}`);
    else goTo('/', id);
  };

  const fg = dark || menuOpen ? 'text-paper' : 'text-ink';
  const pillBg = dark ? 'bg-white/10' : 'bg-black/[0.06]';

  return (
    <header className={`gutter fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between transition-colors duration-500 ${fg}`}>
      <button
        onClick={() => (onHome ? scrollToTarget(0) : goTo('/'))}
        className="display text-2xl"
        aria-label={site.name}
      >
        {site.monogram}
      </button>

      <nav className={`absolute left-1/2 hidden -translate-x-1/2 rounded-md p-1 backdrop-blur-md transition-colors duration-500 md:flex ${pillBg}`}>
        {links.map((link) => {
          const isActive = onHome && active === link.id;
          return (
            <button
              key={link.id}
              onClick={() => go(link.id)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? (dark ? 'bg-paper text-ink' : 'bg-ink text-paper') : 'hover:opacity-60'
              }`}
            >
              {t(link.label)}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex text-sm font-medium" role="group" aria-label="Language">
          {(['tr', 'en'] as const).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`px-1.5 uppercase transition-opacity ${lang === code ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              {code}
            </button>
          ))}
        </div>
        <a
          href={site.cv}
          download
          className={`pill hidden sm:inline-flex ${dark ? 'border-paper/60 hover:bg-paper hover:text-ink' : 'border-ink/70 hover:bg-ink hover:text-paper'}`}
        >
          {t(ui.cv)}
        </a>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="relative z-10 flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className={`h-px w-6 bg-current transition-transform ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
          <span className={`h-px w-6 bg-current transition-transform ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        className={`fixed inset-0 -z-10 flex flex-col justify-end bg-ink px-4 pb-10 text-paper transition-[clip-path] duration-700 ease-[cubic-bezier(.77,0,.18,1)] md:hidden ${
          menuOpen ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_0_100%_0)]'
        }`}
      >
        {links.map((link, i) => (
          <button key={link.id} onClick={() => go(link.id)} className="display text-left text-6xl">
            <span className="mr-3 align-top text-sm font-sans text-mute">0{i + 1}</span>
            {t(link.label)}
          </button>
        ))}
        <a href={site.cv} download className="pill mt-8 w-fit border-paper/60">
          {t(ui.cv)}
        </a>
      </div>
    </header>
  );
}
