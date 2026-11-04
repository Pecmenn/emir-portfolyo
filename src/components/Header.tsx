import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cvUrl, play, site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { navLinks as links } from '../lib/nav';
import { lenis, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Üst menü: solda ad (EMİR + şarap renginde OKUTAN), ortada bölüm bağlantıları, sağda dil ve "Birlikte çalışalım".
// Kaydırınca altına ince bir çizgi gelir. Telefonda menü tam ekran açılır.
function useActiveSection() {
  const { pathname } = useLocation();
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const check = () => {
      setScrolled(window.scrollY > 10);
      // Çizgiyi (ekranın %40'ı) geçen bölümlerden sayfada en altta olanı etkindir
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
    const unsubscribe = lenis.on('scroll', check);
    window.addEventListener('resize', check);
    return () => {
      unsubscribe();
      window.removeEventListener('resize', check);
    };
  }, [pathname]);
  return { active, scrolled };
}

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { goTo } = useTransition();
  const { pathname } = useLocation();
  const { active, scrolled } = useActiveSection();
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
    lenis.start();
    if (onHome) scrollToTarget(`#${id}`);
    else goTo('/', id);
  };

  // Menü açıkken: arka plan kaymaz, Esc kapatır, Tab menünün içinde döner
  useEffect(() => {
    if (!menuOpen) return;
    lenis.stop();
    const focusTimer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, a')?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return closeMenu(true);
      if (e.key !== 'Tab') return;
      const items = Array.from(headerRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? []).filter((el) => el.offsetParent !== null);
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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const panelState = menuOpen ? {} : ({ inert: '', 'aria-hidden': true } as Record<string, unknown>);
  const [first, ...rest] = site.name.split(' ').slice(-2);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${scrolled && !menuOpen ? 'border-seam' : 'border-transparent'}`}
    >
      {/* Bulanık zemin ayrı katmanda: üst öğedeki backdrop-filter, içindeki tam ekran menünün ölçüsünü başlık boyuna indirir */}
      <div aria-hidden className={`absolute inset-0 -z-20 transition-colors duration-500 ${scrolled && !menuOpen ? 'bg-coal/80 backdrop-blur-md' : ''}`} />
      <div className="gutter flex h-[68px] items-center justify-between gap-4">
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('main')?.focus({ preventScroll: true });
            scrollToTarget('#main', true);
          }}
          className="absolute left-4 top-2 z-[60] -translate-y-24 rounded-md bg-cream px-4 py-2 text-sm font-semibold text-coal shadow-lg focus-visible:translate-y-0"
        >
          {t(ui.skip)}
        </a>

        <button onClick={() => (onHome ? scrollToTarget(0) : goTo('/'))} className="min-h-11 font-display text-2xl uppercase tracking-[0.02em]" aria-label={site.name}>
          {/* Son iki kelime: "Emir" krem, "Okutan" şarap; Türkçe büyük harf kuralı için lang="tr" */}
          <span lang="tr">{first}</span>
          <span lang="tr" className="text-wine-light">
            {rest.join(' ')}
          </span>
        </button>

        <nav aria-label={t(ui.mainMenu)} className="hidden gap-7 text-[15px] font-medium min-[900px]:flex">
          {links.map((link) => {
            const isActive = onHome && active === link.id;
            return (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`group relative py-1 transition-colors duration-300 ${isActive ? 'text-cream' : 'text-stone hover:text-cream'}`}
              >
                {t(link.label)}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-current transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:origin-left group-hover:scale-x-100 ${isActive ? 'scale-x-100' : ''}`}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex text-sm" role="group" aria-label={t(ui.language)}>
            {(['tr', 'en'] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`min-h-11 min-w-9 uppercase transition-colors ${lang === code ? 'font-semibold text-cream' : 'text-stone hover:text-cream'}`}
              >
                {code}
              </button>
            ))}
          </div>
          <button onClick={() => go('iletisim')} className="btn btn-wine hidden min-h-11 px-5 sm:inline-flex">
            {t(play.ctaContact)} <span aria-hidden className="arrow">→</span>
          </button>
          <button
            ref={toggleRef}
            onClick={() => setMenuOpen((o) => !o)}
            className="relative z-10 flex h-11 w-11 flex-col items-center justify-center gap-1.5 min-[900px]:hidden"
            aria-label={t(ui.menu)}
            aria-expanded={menuOpen}
            aria-controls="mobil-menu"
          >
            <span className={`h-px w-6 bg-current transition-transform duration-500 ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`h-px w-6 bg-current transition-transform duration-500 ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      <div
        id="mobil-menu"
        ref={panelRef}
        {...panelState}
        // Yatay telefonda menü ekrana sığmayabilir: kayar, içerik yine alta yaslanır (üstten kesilmez)
        className={`gutter fixed inset-0 -z-10 flex flex-col overflow-y-auto overscroll-contain bg-coal pb-10 pt-[68px] duration-700 ease-[cubic-bezier(.77,0,.18,1)] min-[900px]:hidden ${
          menuOpen ? 'visible transition-[clip-path] [clip-path:inset(0_0_0_0)]' : 'invisible transition-[clip-path,visibility] [clip-path:inset(0_0_100%_0)]'
        }`}
      >
        {links.map((link, i) => (
          <button
            key={link.id}
            onClick={() => go(link.id)}
            className={`display flex items-baseline gap-4 py-0.5 text-left text-[clamp(3rem,14vw,5rem)] [@media(max-height:520px)]:text-[2.6rem] ${i === 0 ? 'mt-auto' : ''}`}
          >
            <span className="font-sans text-sm text-stone">0{i + 1}</span>
            {t(link.label)}
          </button>
        ))}
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => go('iletisim')} className="btn btn-wine">
            {t(play.ctaContact)} <span aria-hidden>→</span>
          </button>
          {cvUrl && (
            <a href={cvUrl} download className="btn">
              {t(ui.cv)}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
