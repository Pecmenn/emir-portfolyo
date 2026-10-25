import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects, ui } from '../content';
import { useLang } from './i18n';
import { gsap, lenis, reducedMotion } from './scroll';

// Sayfa geçişi: koyu bir perde üst kenarı kavisli olarak aşağıdan yükselir, ortasında gidilen sayfanın adı belirir;
// yeni sayfa hazır olunca perde yukarı çekilir. Proje sayfasında kapak görseli yüklenene kadar beklenir.
type TransitionContextValue = {
  // source ve cover eski geçişten kalma imza uyumu için kabul edilir; perde yalnızca proje adını kullanır
  openProject: (slug: string, cover?: string, source?: HTMLElement | null) => void;
  goTo: (path: string, hash?: string) => void;
  // Proje sayfası kapak görseli hazır olunca çağırır
  coverReady: () => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

const CURVE_IN = '50% 50% 0% 0% / 14vh 14vh 0vh 0vh';
const CURVE_FLAT = '0% 0% 0% 0% / 0vh 0vh 0vh 0vh';
const CURVE_OUT = '0% 0% 50% 50% / 0vh 0vh 14vh 14vh';

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const busy = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const coverResolver = useRef<(() => void) | null>(null);

  const coverReady = useCallback(() => {
    coverResolver.current?.();
    coverResolver.current = null;
  }, []);

  const run = useCallback(
    async (path: string, label: string, after: () => void, waitCover: boolean) => {
      if (busy.current) return;
      if (reducedMotion) {
        navigate(path);
        await nextFrame();
        after();
        return;
      }
      busy.current = true;
      lenis.stop();
      const panel = panelRef.current!;
      const text = labelRef.current!;
      text.textContent = label;
      const line = text.parentElement!;
      line.style.visibility = label ? 'visible' : 'hidden';
      gsap.set(panel, { display: 'flex', yPercent: 100, borderRadius: CURVE_IN });
      gsap.set(line, { yPercent: 60, opacity: 0 });

      const cover = gsap.timeline();
      cover.to(panel, { yPercent: 0, borderRadius: CURVE_FLAT, duration: 0.75, ease: 'power3.inOut' }, 0);
      cover.to(line, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.35);
      await cover;

      const ready = waitCover
        ? new Promise<void>((resolve) => {
            coverResolver.current = resolve;
            // Kapak hiç yüklenmezse geçişi takılı bırakma
            window.setTimeout(resolve, 1800);
          })
        : Promise.resolve();
      navigate(path);
      await nextFrame();
      lenis.start();
      after();
      await Promise.all([ready, new Promise((r) => window.setTimeout(r, 250))]);
      await nextFrame();

      const reveal = gsap.timeline();
      reveal.to(line, { yPercent: -60, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
      reveal.to(panel, { yPercent: -100, borderRadius: CURVE_OUT, duration: 0.85, ease: 'power3.inOut' }, 0.1);
      await reveal;
      gsap.set(panel, { display: 'none' });
      busy.current = false;
    },
    [navigate],
  );

  const openProject = useCallback(
    (slug: string) => {
      const title = projects.find((p) => p.slug === slug)?.title ?? '';
      run(`/proje/${slug}`, title, () => lenis.scrollTo(0, { immediate: true, force: true }), true);
    },
    [run],
  );

  const goTo = useCallback(
    (path: string, hash?: string) => {
      const label = path === '/' ? t(ui.home) : '';
      run(
        path,
        label,
        () => {
          // Yeni sayfanın yüksekliği ölçülmeden kaydırılırsa hedef eski sınıra takılır
          lenis.resize();
          if (hash) lenis.scrollTo(`#${hash}`, { immediate: true, force: true });
          else lenis.scrollTo(0, { immediate: true, force: true });
        },
        false,
      );
    },
    [run, t],
  );

  return (
    <TransitionContext.Provider value={{ openProject, goTo, coverReady }}>
      {children}
      <div ref={panelRef} aria-hidden className="pointer-events-none fixed inset-x-0 -bottom-[14vh] top-0 z-[90] hidden items-center justify-center bg-ink pb-[14vh] text-paper">
        <p className="flex items-center gap-4 text-[clamp(1.8rem,3.4vw,3.6rem)] tracking-[-0.03em]">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-soft" />
          <span ref={labelRef} />
        </p>
      </div>
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used inside TransitionProvider');
  return ctx;
}
