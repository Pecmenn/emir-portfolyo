import { useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion, refreshSoon, ScrollTrigger } from '../lib/scroll';
import { Words } from './Reveal';

// Kaydırmaya bağlı sunum blokları. Üçü de aynı kalıbı kullanır: bölüm uzun bir alan kaplar, içindeki sahne
// ekrana yapışık (sticky) kalır ve animasyon kaydırma ilerlemesine bağlanır (scrub). Hareket azaltma tercihinde
// sahneler sabit, son hâlleriyle gösterilir.

const pad = (n: number) => String(n).padStart(2, '0');

// Sıraya bağlı sabit sahte rastgele sayı (0–1): parçalar her çizimde aynı yerden, aynı açıyla uçar
function seeded(i: number, k: number) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Heading({ title, text, className = '' }: { title: string; text: string; className?: string }) {
  const { lang } = useLang();
  if (!title.trim() && !text.trim()) return null;
  return (
    <div className={className}>
      {title.trim() && <Words key={`h-${lang}`} as="h2" text={title} className="display text-[clamp(2rem,3.4vw,5rem)] leading-[1.02]" />}
      {text.trim() && (
        <Words key={`p-${lang}`} text={text} className="mt-[2vh] max-w-md text-[clamp(1rem,1.1vw,1.5rem)] font-medium leading-snug opacity-75" />
      )}
    </div>
  );
}

// Parçalar kaydırdıkça sırayla ekrana uçar ve dizilir; soldaki sayaç yerine oturan parçaları sayar.
// fan: parçalar alttaki bir eksen etrafında yelpaze gibi açılır (dikey duran kaykaylar, kartlar)
// grid: parçalar ızgarada yerlerinde zıplayarak belirir (karakter portreleri, ikonlar)
export function Flock({ title, text, images, layout, alt }: { title: string; text: string; images: string[]; layout: 'fan' | 'grid'; alt: string }) {
  const ref = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const n = images.length;
  const fan = layout === 'fan';

  useLayoutEffect(() => {
    if (reducedMotion) return;
    // Her parçanın uçuşu bir öncekinden STEP kadar sonra başlar ve DUR sürer
    const STEP = 0.55;
    const DUR = 1;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const t = self.progress * (self.animation?.duration() ?? 0);
            const landed = Math.max(0, Math.min(n, Math.floor((t - DUR) / STEP) + 1));
            if (countRef.current) countRef.current.textContent = pad(landed);
          },
        },
      });
      gsap.utils.toArray<HTMLElement>('[data-flock-item]').forEach((el, i) => {
        const side = i % 2 ? 1 : -1;
        const vars = fan
          ? {
              // Ekranın altından, iki yandan dönerek fırlatılır
              x: () => side * window.innerWidth * (0.3 + seeded(i, 1) * 0.35),
              y: () => window.innerHeight * (0.75 + seeded(i, 2) * 0.4),
              rotation: side * (220 + seeded(i, 3) * 320),
              scale: 0.75,
              opacity: 0,
              ease: 'power3.out',
            }
          : { scale: 0, rotation: (seeded(i, 1) - 0.5) * 70, y: 60, opacity: 0, ease: 'back.out(1.7)' };
        tl.from(el, { ...vars, duration: DUR }, i * STEP);
      });
      // Son parça da yerine oturduktan sonra bölüm bir süre dizili kalır
      tl.to({}, { duration: 0.9 });
    }, ref);
    return () => ctx.revert();
  }, [images.join('|'), fan, n]);

  const spread = Math.min(76, n * 7);
  const cols = n <= 4 ? n : n <= 9 ? 3 : 4;
  const rows = Math.ceil(n / cols);

  return (
    <section ref={ref} className="relative" style={reducedMotion ? undefined : { height: `${100 + n * (fan ? 16 : 9)}vh` }}>
      <div className={reducedMotion ? 'py-[8vh]' : 'sticky top-0 flex h-[100svh] items-center overflow-hidden'}>
        <div className="gutter grid w-full gap-[4vh] pt-16 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pt-0">
          <div className="lg:col-span-4">
            <p aria-hidden className="display text-[clamp(2.75rem,6vw,8rem)] leading-[0.85] tabular-nums opacity-25">
              <span ref={countRef}>{pad(reducedMotion ? n : 0)}</span>
              <span className="opacity-50">/{pad(n)}</span>
            </p>
            <Heading title={title} text={text} className="mt-[2.5vh]" />
          </div>
          <div className="lg:col-span-8">
            {fan ? (
              <div className="relative mx-auto h-[34svh] lg:h-[60vh]">
                {images.map((src, i) => {
                  const t = n > 1 ? i / (n - 1) - 0.5 : 0;
                  return (
                    // Dış katman yelpazedeki yeri, orta katman uçuşu, görsel fareyle öne çekilmeyi taşır
                    <div
                      key={`${src}-${i}`}
                      className="absolute bottom-[8%] left-1/2 h-[74%] origin-[50%_180%]"
                      style={{ transform: `translateX(-50%) rotate(${t * spread}deg)`, zIndex: i }}
                    >
                      <div data-flock-item className="h-full">
                        <img
                          src={src}
                          alt={alt}
                          draggable={false}
                          onLoad={refreshSoon}
                          className="h-full w-auto max-w-none select-none drop-shadow-[0_18px_22px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-out hover:-translate-y-[10%]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Izgara genişliği sütun/satır oranına göre sınırlanır; parçalar geniş hücrelere dağılmadan bir arada durur
              <div
                className="mx-auto grid h-[var(--gh)] gap-[1.5vh] [--gh:42svh] lg:gap-[2.5vh] lg:[--gh:68vh]"
                style={{
                  maxWidth: `calc(var(--gh) * ${(cols / rows) * 0.95})`,
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {images.map((src, i) => (
                  <div key={`${src}-${i}`} data-flock-item className="flex min-h-0 items-center justify-center">
                    <img
                      src={src}
                      alt={alt}
                      draggable={false}
                      onLoad={refreshSoon}
                      className="h-full w-auto max-w-full select-none object-contain transition-transform duration-500 ease-out hover:-rotate-6 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Taslak görsel ekranda sabitken son hâli soldan sağa perde gibi açılır; ayırıcı çizgi ilerlemeyi gösterir.
// İki görsel üst üste birebir oturduğu için aynı boyutta olmalı
export function Compare({ before, after, beforeLabel, afterLabel, alt }: { before: string; after: string; beforeLabel: string; afterLabel: string; alt: string }) {
  const ref = useRef<HTMLElement>(null);
  // Görselin oranı: kutu ekran yüksekliğine sığacak genişlikte tutulur, iki görsel ve çizgi aynı kutuya oturur
  const [ratio, setRatio] = useState<number>();

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.fromTo('[data-compare-after]', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 0.15)
        .fromTo('[data-compare-line]', { left: '0%' }, { left: '100%', duration: 1 }, 0.15)
        .fromTo('[data-compare-before-label]', { opacity: 1 }, { opacity: 0.35, duration: 0.4 }, 0.45)
        .fromTo('[data-compare-after-label]', { opacity: 0.35 }, { opacity: 1, duration: 0.4 }, 0.6)
        .to({}, { duration: 0.2 });
      // Sahne ekrana girerken hafifçe büyüyerek yerine oturur
      gsap.from('[data-compare-frame]', {
        scale: 0.9,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top top', scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [before, after]);

  return (
    <section ref={ref} className="relative" style={reducedMotion ? undefined : { height: '240vh' }}>
      <div className={reducedMotion ? 'gutter py-[6vh]' : 'gutter sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-12'}>
        <div data-compare-frame className="mx-auto w-full" style={ratio ? { maxWidth: `calc(74vh * ${ratio})` } : undefined}>
          {/* Çizginin solunda açılan son hâl, sağında kalan taslak; etiketler de bu taraflarda durur */}
          <div className="mb-4 flex items-center justify-between gap-4 text-sm font-medium">
            {!reducedMotion && (
              <span data-compare-after-label className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
                {afterLabel}
              </span>
            )}
            <span data-compare-before-label className="flex items-center gap-2">
              {beforeLabel}
              <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
            </span>
          </div>
          <div className="relative">
            <img
              src={before}
              alt={reducedMotion ? alt : ''}
              draggable={false}
              onLoad={(e) => {
                setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
                refreshSoon();
              }}
              className="block h-auto w-full select-none"
            />
            {!reducedMotion && (
              <>
                <img data-compare-after src={after} alt={alt} draggable={false} className="absolute inset-0 h-full w-full select-none" />
                <div data-compare-line aria-hidden className="absolute -inset-y-[3%] w-[2px] -translate-x-1/2 bg-accent">
                  <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-sm font-semibold text-ink">
                    ↔
                  </span>
                </div>
              </>
            )}
          </div>
          {reducedMotion && (
            <>
              <p className="mb-4 mt-[6vh] flex items-center gap-2 text-sm font-medium">
                <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
                {afterLabel}
              </p>
              <img src={after} alt={alt} className="block h-auto w-full" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// Sayfa aşağı kaydıkça görsel dizisi yatayda akar; alttaki çizgi ne kadar ilerlendiğini gösterir.
// Bölümün yüksekliği, dizinin taşan genişliği kadar kaydırma payı bırakacak şekilde ölçülür
export function Pan({ title, text, images, alt }: { title: string; text: string; images: string[]; alt: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const section = ref.current!;
    const track = trackRef.current!;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const size = () => {
      section.style.height = `${distance() + window.innerHeight}px`;
    };
    size();
    // Her yeniden ölçümden (pencere boyutu, yüklenen görseller) önce kaydırma payı güncellenir
    ScrollTrigger.addEventListener('refreshInit', size);
    // Görseller yüklendikçe dizi genişler
    const ro = new ResizeObserver(refreshSoon);
    ro.observe(track);
    const ctx = gsap.context(() => {
      const st = { trigger: section, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true };
      gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: { ...st, scrub: 0.6 } });
      gsap.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { ...st, scrub: true } });
    }, section);
    return () => {
      ro.disconnect();
      ScrollTrigger.removeEventListener('refreshInit', size);
      ctx.revert();
      section.style.height = '';
    };
  }, [images.join('|')]);

  return (
    <section ref={ref} className="relative">
      <div className={reducedMotion ? 'py-[6vh]' : 'sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-12'}>
        {(title.trim() || text.trim()) && (
          <div className="gutter mb-[5vh] grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-8">
            {title.trim() && (
              <Words key={`h-${lang}`} as="h2" text={title} className="display text-[clamp(2rem,3.4vw,5rem)] leading-[1.02] lg:col-span-6" />
            )}
            {text.trim() && (
              <Words
                key={`p-${lang}`}
                text={text}
                className="max-w-xl text-[clamp(1rem,1.1vw,1.5rem)] font-medium leading-snug opacity-75 lg:col-span-5 lg:col-start-8 lg:pb-[0.4em]"
              />
            )}
          </div>
        )}
        <div className={reducedMotion ? 'overflow-x-auto' : ''}>
          <div ref={trackRef} className="gutter flex w-max items-center gap-[clamp(0.75rem,1.6vw,2rem)] will-change-transform">
            {images.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={alt}
                draggable={false}
                onLoad={refreshSoon}
                // Tek ve çift sıradaki görseller hafif kaydırılır; dizi düz bir şerit yerine dalgalı akar
                className={`h-[clamp(15rem,50vh,38rem)] w-auto max-w-none select-none rounded-[clamp(0.6rem,1vw,1.25rem)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)] ${i % 2 ? 'translate-y-[3vh]' : '-translate-y-[1.5vh]'}`}
              />
            ))}
          </div>
        </div>
        {!reducedMotion && (
          <div className="gutter mt-[6vh]">
            <div className="relative h-px">
              <div className="absolute inset-0 bg-current opacity-15" />
              <div ref={barRef} className="absolute inset-0 origin-left bg-current" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
