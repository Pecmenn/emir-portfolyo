import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap, lenis, reducedMotion } from './scroll';

type TransitionContextValue = {
  // Proje kapağı: tıklanan görsel ekranın ortasında küçülür, sonra yeni sayfanın tam ekran kapağına dönüşür
  openProject: (slug: string, cover: string, source?: HTMLElement | null) => void;
  // Diğer sayfa geçişleri: sütunlar aşağıdan yükselip ekranı kapatır, yeni sayfada yukarı çekilir
  goTo: (path: string, hash?: string) => void;
  // Proje sayfası kapak görseli hazır olunca çağırır
  coverReady: () => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);
const COLUMNS = 5;

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const busy = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLImageElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const coverResolver = useRef<(() => void) | null>(null);

  const coverReady = useCallback(() => {
    coverResolver.current?.();
    coverResolver.current = null;
  }, []);

  const openProject = useCallback(
    async (slug: string, cover: string, source?: HTMLElement | null) => {
      if (busy.current) return;
      const path = `/proje/${slug}`;
      if (reducedMotion) {
        navigate(path);
        lenis.scrollTo(0, { immediate: true, force: true });
        return;
      }
      busy.current = true;
      const overlay = overlayRef.current!;
      const clone = cloneRef.current!;
      lenis.stop();

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = source?.getBoundingClientRect() ?? { left: vw * 0.38, top: vh * 0.3, width: vw * 0.24, height: vh * 0.4 };
      const ratio = rect.width / rect.height || 1.3;
      const centerW = Math.min(vw * 0.26, 420);
      const centerH = centerW / ratio;

      // Kapak görseli olmayan (yalnızca videolu) projelerde görsel uçuşu atlanır, sadece renk perdesi kullanılır
      const hasCover = !!cover;
      if (hasCover) {
        clone.src = cover;
        gsap.set(clone, { display: 'block', left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      }
      gsap.set(overlay, { display: 'block', clipPath: 'inset(100% 0% 0% 0%)' });

      const out = gsap.timeline();
      out.to(overlay, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.inOut' }, 0);
      if (hasCover) {
        out.to(
          clone,
          { left: (vw - centerW) / 2, top: (vh - centerH) / 2, width: centerW, height: centerH, duration: 0.8, ease: 'power3.inOut' },
          0,
        );
      }
      await out;

      const ready = new Promise<void>((resolve) => {
        coverResolver.current = resolve;
        // Kapak hiç yüklenmezse geçişi takılı bırakma
        window.setTimeout(resolve, 2500);
      });
      navigate(path);
      lenis.scrollTo(0, { immediate: true, force: true });
      await ready;
      await nextFrame();

      const reveal = gsap.timeline();
      if (hasCover) reveal.to(clone, { left: 0, top: 0, width: vw, height: vh, duration: 0.9, ease: 'expo.inOut' }, 0);
      reveal.to(overlay, { opacity: 0, duration: hasCover ? 0.3 : 0.6 }, hasCover ? 0.75 : 0);
      await reveal;

      gsap.set(clone, { display: 'none' });
      gsap.set(overlay, { display: 'none', opacity: 1 });
      lenis.start();
      busy.current = false;
    },
    [navigate],
  );

  const goTo = useCallback(
    async (path: string, hash?: string) => {
      if (busy.current) return;
      const scrollAfter = () => {
        // Yeni sayfanın yüksekliği ölçülmeden kaydırılırsa hedef eski sınıra takılır
        lenis.resize();
        if (hash) lenis.scrollTo(`#${hash}`, { immediate: true, force: true });
        else lenis.scrollTo(0, { immediate: true, force: true });
      };
      if (reducedMotion) {
        navigate(path);
        await nextFrame();
        scrollAfter();
        return;
      }
      busy.current = true;
      lenis.stop();
      const cols = columnsRef.current!;
      const bars = cols.children;
      gsap.set(cols, { display: 'flex' });
      await gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: '50% 100%' },
        { scaleY: 1, duration: 0.55, ease: 'power3.inOut', stagger: 0.06 },
      );
      navigate(path);
      await nextFrame();
      lenis.start();
      scrollAfter();
      await gsap.to(bars, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.55, ease: 'power3.inOut', stagger: 0.06 });
      gsap.set(cols, { display: 'none' });
      busy.current = false;
    },
    [navigate],
  );

  return (
    <TransitionContext.Provider value={{ openProject, goTo, coverReady }}>
      {children}
      <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-[90] hidden bg-accent" />
      <img ref={cloneRef} alt="" className="pointer-events-none fixed z-[91] hidden object-cover" />
      <div ref={columnsRef} className="pointer-events-none fixed inset-0 z-[90] hidden">
        {Array.from({ length: COLUMNS }, (_, i) => (
          <div key={i} className="h-full flex-1 bg-ink" />
        ))}
      </div>
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used inside TransitionProvider');
  return ctx;
}
