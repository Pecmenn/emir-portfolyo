import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { projects, ui } from '../content';
import AutoVideo from '../components/AutoVideo';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion } from '../lib/scroll';
import { useTransition } from '../lib/transition';

const featured = projects.filter((p) => p.featured);
const AUTOPLAY = 7;

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' aria-hidden>
      <path d='M11 5 6 9H3v6h3l5 4V5z' />
      {on ? <path d='M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13' /> : <path d='m16 9 5 6m0-6-5 6' />}
    </svg>
  );
}

// Tam ekran öne çıkan işler: otomatik ilerler, sürüklenebilir, ok tuşlarıyla gezilir
export default function Hero({ ready }: { ready: boolean }) {
  const { t } = useLang();
  const { openProject } = useTransition();
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<(HTMLSpanElement | null)[]>([]);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const current = featured[index];
  // Showreel sesi: tarayıcılar sesli oynatmayı ancak kullanıcı düğmeye bastıktan sonra izin verir
  const [soundOn, setSoundOn] = useState(false);
  const hasVideo = !!current.coverVideo;

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + featured.length) % featured.length), []);

  // Slayt değişimi: yeni görsel alttan perde gibi açılır, başlık maskenin altından gelir
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      slidesRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { zIndex: i === index ? 2 : 1 });
      });
      const active = slidesRef.current[index];
      if (active && !reducedMotion) {
        gsap.fromTo(active, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' });
        gsap.fromTo(active.querySelectorAll('img, video'), { scale: 1.25 }, { scale: 1.05, duration: 2.4, ease: 'expo.out' });
      }
      if (!reducedMotion) gsap.fromTo('[data-hero-line]', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
    }, rootRef);
    return () => ctx.revert();
  }, [index]);

  // İlerleme çizgisi dolunca sonraki slayta geç
  useEffect(() => {
    // Ses açıkken izleyen kişiyi bölmemek için slayt kendiliğinden ilerlemez
    if (!ready || (soundOn && hasVideo)) return;
    const bar = progressRef.current[index];
    if (!bar) return;
    const tween = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: AUTOPLAY, ease: 'none', onComplete: () => go(1) });
    return () => {
      tween.kill();
      gsap.set(bar, { scaleX: 0 });
    };
  }, [index, ready, go, soundOn, hasVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, moved: false };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    else openProject(current.slug, current.cover, slidesRef.current[index]);
  };

  return (
    <section ref={rootRef} data-theme="dark" className="relative h-[100svh] overflow-hidden bg-ink text-paper">
      <div
        className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
        data-cursor={t(ui.view)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {featured.map((p, i) => (
          <div key={p.slug} ref={(el) => (slidesRef.current[i] = el)} className="absolute inset-0">
            {p.cover && <img src={p.cover} alt={p.title} draggable={false} className="h-full w-full scale-105 object-cover" />}
            {p.coverVideo && (
              <AutoVideo
                src={p.coverVideo}
                poster={p.cover || undefined}
                active={ready && i === index}
                muted={!(soundOn && i === index)}
                className="absolute inset-0 h-full w-full scale-105 object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60" />
          </div>
        ))}
      </div>

      <div ref={titleRef} className="gutter pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 items-end justify-between gap-6">
        <h1 className="display text-[clamp(4rem,13vw,12rem)]">
          <span className="line-mask">
            <span data-hero-line className="block">
              {current.title}
            </span>
          </span>
        </h1>
        <div className="pb-4 text-right text-sm font-medium">
          <span className="line-mask">
            <span data-hero-line className="block">
              {current.year}
            </span>
          </span>
          <span className="line-mask">
            <span data-hero-line className="block">
              {t(current.discipline)}
            </span>
          </span>
        </div>
      </div>

      <div className="gutter absolute inset-x-0 bottom-0 z-10 pb-6">
        <div className="grid grid-cols-3 gap-4">
          {featured.map((p, i) => (
            <button key={p.slug} onClick={() => setIndex(i)} className="text-left" aria-label={p.title}>
              <span className={`display block text-3xl transition-opacity sm:text-4xl ${i === index ? 'opacity-100' : 'opacity-30'}`}>
                0{i + 1}.
              </span>
              <span className="mt-3 block h-px w-full bg-white/20">
                <span ref={(el) => (progressRef.current[i] = el)} className="block h-full origin-left scale-x-0 bg-paper" />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-xs font-medium sm:text-sm">
          <span className="hidden sm:inline">{t(ui.drag)}</span>
          <div className="flex items-center gap-4">
            <button onClick={() => go(-1)} aria-label="Previous" className="px-1 hover:text-accent">
              ←
            </button>
            <span>{t(ui.navigate)}</span>
            <button onClick={() => go(1)} aria-label="Next" className="px-1 hover:text-accent">
              →
            </button>
          </div>
          <div className="flex items-center gap-4">
            {hasVideo && (
              <button
                onClick={() => setSoundOn((on) => !on)}
                aria-pressed={soundOn}
                className="pill border-white/40 px-3 py-1 text-xs hover:bg-paper hover:text-ink sm:text-sm"
              >
                <SoundIcon on={soundOn} />
                {t(soundOn ? ui.soundOff : ui.soundOn)}
              </button>
            )}
            <span className="hidden sm:inline">{t(ui.featured)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
