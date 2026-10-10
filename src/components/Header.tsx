import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cvUrl, site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { navLinks as links } from '../lib/nav';
import { lenis, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Üst menünün altındaki bölüm koyuysa menü açık renge döner
function useHeaderTheme() {
  const { pathname } = useLocation();
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const check = () => {
      setScrolled(window.scrollY > 40);
      const probe = 36;
      const themed = document.querySelectorAll<HTMLElement>('[data-theme]');
      let isDark = false;
      for (const el of themed) {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) isDark = el.dataset.theme === 'dark';
      }
      setDark(isDark);

      // Etkin bölüm menü sırasına göre değil sayfadaki gerçek (DOM) sırasına göre bulunur:
      // çizgiyi (ekranın %40'ı) geçen bölümlerden en altta olanı etkindir
      let current = '';
      let currentTop = -Infinity;
      for (const { id } of links) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= window.innerHeight * 0.4 && top > currentTop) {
          current = id;
          currentTop = top;
        }
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

  return { dark, active, scrolled };
}

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { goTo } = useTransition();
  const { pathname } = useLocation();
  const { dark, active, scrolled } = useHeaderTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onHome = pathname === '/';

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  const go = (id: string) => {
    closeMenu();
    // Menü açıkken kaydırma durdurulmuştur; hedefe gitmeden önce yeniden başlatılır
    lenis.start();
    if (onHome) scrollToTarget(`#${id}`);
    else goTo('/', id);
  };

  // Menü açıkken: arka plan kaymaz, Esc kapatır, Tab menünün içinde döner; açılınca odak panele geçer
  useEffect(() => {
    if (!menuOpen) return;
    lenis.stop();
    // Panel görünür olduktan sonra odaklanır (açılış geçişi visibility'yi bir kare sonra açar)
    const focusTimer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, a')?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu(true);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey);
      lenis.start();
    };
  }, [menuOpen, closeMenu]);

  // Geniş ekrana geçilirse ya da sayfa değişirse menü kapanır
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const fg = dark || menuOpen ? 'text-paper' : 'text-ink';
  const pillBg = dark ? 'bg-white/10' : 'bg-black/[0.06]';
  // Sayfa kaydırılınca menü altındaki içerikle çakışmasın diye buzlu bir zemin alır
  const surface = scrolled && !menuOpen ? (dark ? 'bg-ink/60 backdrop-blur-md' : 'bg-paper/80 backdrop-blur-md') : 'bg-transparent';
  // Kapalı panel odaklanamaz ve ekran okuyucudan gizlenir (React 18 `inert` özniteliğini tanımaz, düz öznitelik olarak verilir)
  const panelState = menuOpen ? {} : ({ inert: '', 'aria-hidden': true } as Record<string, unknown>);

  return (
    <header
      ref={headerRef}
      className={`gutter fixed inset-x-0 top-0 z-50 flex h-[64px] items-center justify-between transition-colors duration-500 sm:h-[72px] ${fg} ${surface}`}
    >
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus({ preventScroll: true });
          scrollToTarget('#main', true);
        }}
        className="absolute left-4 top-2 z-[60] -translate-y-24 rounded-md bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-lg focus-visible:translate-y-0"
      >
        {t(ui.skip)}
      </a>
      <button
        onClick={() => (onHome ? scrollToTarget(0) : goTo('/'))}
        className="display flex min-h-11 items-center text-2xl"
        aria-label={site.name}
      >
        {site.monogram}
      </button>

      <nav
        aria-label={t(ui.mainMenu)}
        className={`absolute left-1/2 hidden -translate-x-1/2 gap-0.5 rounded-lg p-1.5 backdrop-blur-md transition-colors duration-500 md:flex ${pillBg}`}
      >
        {links.map((link) => {
          const isActive = onHome && active === link.id;
          return (
            <button
              key={link.id}
              onClick={() => go(link.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`rounded-md px-4 py-2 text-[15px] font-medium transition-colors ${
                isActive ? (dark ? 'bg-paper text-ink' : 'bg-ink text-paper') : 'hover:opacity-60'
              }`}
            >
              {t(link.label)}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center">
        <div className="flex text-sm" role="group" aria-label={t(ui.language)}>
          {(['tr', 'en'] as const).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`min-h-11 min-w-11 uppercase transition-opacity ${
                lang === code ? 'font-bold underline decoration-2 underline-offset-[6px]' : 'font-medium opacity-75 hover:opacity-100'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
        <button
          ref={toggleRef}
          onClick={() => setMenuOpen((o) => !o)}
          className="relative z-10 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={t(ui.menu)}
          aria-expanded={menuOpen}
          aria-controls="mobil-menu"
        >
          <span className={`h-px w-6 bg-current transition-transform ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
          <span className={`h-px w-6 bg-current transition-transform ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        id="mobil-menu"
        ref={panelRef}
        {...panelState}
        className={`fixed inset-0 -z-10 flex flex-col justify-end bg-ink px-4 pb-10 text-paper duration-700 ease-[cubic-bezier(.77,0,.18,1)] md:hidden ${
          // Açılırken görünürlük hemen açılır; kapanırken perde inene kadar bekler (odaklanamaz ama animasyon bozulmaz)
          menuOpen ? 'visible transition-[clip-path] [clip-path:inset(0_0_0_0)]' : 'invisible transition-[clip-path,visibility] [clip-path:inset(0_0_100%_0)]'
        }`}
      >
        {links.map((link, i) => (
          <button key={link.id} onClick={() => go(link.id)} className="display py-1 text-left text-6xl">
            <span className="mr-3 align-top font-sans text-sm text-mute">0{i + 1}</span>
            {t(link.label)}
          </button>
        ))}
        {cvUrl && (
          <a href={cvUrl} download className="pill mt-8 min-h-11 w-fit border-paper/60">
            {t(ui.cv)}
          </a>
        )}
      </div>
    </header>
  );
}
