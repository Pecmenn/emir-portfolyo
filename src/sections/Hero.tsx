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

  // Slayt değişimi: yeni görsel eski görselin üstünde alttan perde gibi açılır; eski başlık yukarı kayarak çıkar,
  // yenisi aşağıdan gelir. Animasyonlar her geçişte sıfırlanmaz (yoksa önceki slayt zıplar), yalnızca üzerine yazılır.
  const prevIndex = useRef<number | null>(null);
  const lines = (i: number) => rootRef.current?.querySelectorAll(`[data-slide="${i}"] [data-hero-line]`) ?? [];

  useLayoutEffect(() => {
    const prev = prevIndex.current;
    prevIndex.current = index;
    const slides = slidesRef.current;

    slides.forEach((el, i) => el && gsap.set(el, { zIndex: i === index ? 3 : i === prev ? 2 : 1 }));
    featured.forEach((_, i) => {
      if (i !== index && i !== prev) gsap.set(lines(i), { yPercent: 110 });
    });
    if (reducedMotion) {
      gsap.set(lines(index), { yPercent: 0 });
      if (prev !== null) gsap.set(lines(prev), { yPercent: 110 });
      return;
    }

    const active = slides[index];
    if (active && prev !== null) {
      gsap.fromTo(active, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', overwrite: true });
    }
    if (active) gsap.fromTo(active.querySelectorAll('img, video'), { scale: 1.25 }, { scale: 1.05, duration: 2.4, ease: 'expo.out', overwrite: true });
    if (prev !== null) gsap.to(lines(prev), { yPercent: -110, duration: 0.55, ease: 'power3.in', stagger: 0.04, overwrite: true });
    gsap.fromTo(lines(index), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06, delay: prev === null ? 0.25 : 0.45, overwrite: true });
  }, [index]);

  // Bileşen kaldırılınca çalışan geçişleri durdur
  useEffect(() => () => gsap.killTweensOf(rootRef.current?.querySelectorAll('[data-hero-line], [data-slide-media], img, video') ?? []), []);

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
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {featured.map((p, i) => (
          <div key={p.slug} ref={(el) => (slidesRef.current[i] = el)} className="absolute inset-0">
            {p.cover && <img src={p.cover} alt={p.title} draggable={false} className="h-full w-full scale-105 object-cover object-[28%_50%] md:object-center" />}
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
        {/* Her slaytın başlığı aynı yerde üst üste durur; böylece eskisi çıkarken yenisi girebilir */}
        <h1 className="display grid text-[clamp(4rem,13vw,12rem)]">
          {featured.map((p, i) => (
            // self-end: her başlık kendi yüksekliğinde maskelenir ve alt çizgiye oturur; iki satıra kırılan uzun
            // başlıklar varken tek satırlıklar gizliyken ikinci satırda görünmez
            <span key={p.slug} data-slide={i} aria-hidden={i !== index} className="line-mask self-end [grid-area:1/1]">
              <span data-hero-line className="block">
                {p.title}
              </span>
            </span>
          ))}
        </h1>
        <div className="grid pb-[1.2vw] text-right font-medium">
          {featured.map((p, i) => (
            <span key={p.slug} data-slide={i} aria-hidden={i !== index} className="[grid-area:1/1]">
              <span className="line-mask">
                <span data-hero-line className="display block text-[clamp(1.75rem,2.6vw,3.25rem)]">
                  {p.year}
                </span>
              </span>
              <span className="line-mask">
                <span data-hero-line className="mt-1 block text-[clamp(1rem,1.3vw,1.6rem)] leading-tight text-paper/85">
                  {t(p.discipline)}
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="gutter absolute inset-x-0 bottom-0 z-10 pb-6">
        {/* Öne çıkan proje sayısı kadar sütun */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${featured.length}, minmax(0, 1fr))` }}>
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
