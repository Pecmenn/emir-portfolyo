import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { play, projects, type Text } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import Contact from '../sections/Contact';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { gsap, reducedMotion, refreshSoon, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Ana sayfa: açılışta projelerden kesilmiş parçalarla bir oyun alanı, altında filtrelenebilen proje indeksi,
// hizmetler ve iletişim. Metinler ve parçalar src/content/play.json'da, panelde "Ana sayfa" altında.

// Fizik motoru metinden sonra yüklenir; açılış yazısı beklemeden görünür
const StickerField = lazy(() => import('../components/StickerField'));

function PlayHero({ ready }: { ready: boolean }) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const clearRef = useRef<HTMLDivElement>(null);
  const [dragged, setDragged] = useState(false);
  const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[600px] overflow-hidden bg-paper">
      <div ref={textRef} className="gutter relative z-10 pt-[clamp(6.5rem,15vh,10rem)]">
        <p className="text-[clamp(1rem,1.2vw,1.4rem)] font-medium">{t(play.hello)}</p>
        <Lines key={lang} as="h1" lines={play.statement[lang]} className="display mt-3 text-[clamp(1.75rem,9.4vw,4.5rem)] leading-[0.92] lg:text-[clamp(3rem,7.6vw,9.5rem)]" />
        {/* Parçaların üstüne yığılmaması gereken alan: açıklama ve düğmeler */}
        <div ref={clearRef} className="inline-block">
          <p className="mt-6 max-w-md text-[clamp(1rem,1.1vw,1.35rem)] font-medium leading-snug opacity-75">{t(play.text)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToTarget('#isler')}
              className="pill min-h-11 border-ink bg-ink px-5 py-2.5 text-base text-paper hover:bg-transparent hover:text-ink"
            >
              {t(play.ctaWork)} <span aria-hidden>↓</span>
            </button>
            <button type="button" onClick={() => scrollToTarget('#iletisim')} className="pill min-h-11 border-ink px-5 py-2.5 text-base hover:bg-ink hover:text-paper">
              {t(play.ctaContact)}
            </button>
          </div>
        </div>
      </div>
      {/* Parçalar açılış ekranı kalkınca düşmeye başlar */}
      <Suspense fallback={null}>
        <StickerField hostRef={ref} textRef={textRef} keepClearRef={clearRef} stickers={play.stickers} ready={ready} onFirstDrag={() => setDragged(true)} />
      </Suspense>
      {!reducedMotion && (
        <p
          aria-hidden
          className={`pointer-events-none absolute bottom-6 right-5 z-30 flex items-center gap-2 text-sm font-medium transition-opacity duration-700 sm:right-8 lg:bottom-auto lg:top-[clamp(6.5rem,15vh,10rem)] ${dragged ? 'opacity-0' : 'opacity-60'}`}
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
          {t(touch ? play.hintTouch : play.hint)}
        </p>
      )}
    </section>
  );
}

// Dev puntolu proje listesi; disipline göre süzülür. Fareyle bir projenin başlık şeridine gelince kapak o şeridin içinde açılır
function ProjectIndex() {
  const { t } = useLang();
  const { openProject } = useTransition();
  const [filter, setFilter] = useState('all');
  const [hover, setHover] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const disciplines: Text[] = [];
  for (const p of projects) if (!disciplines.some((d) => d.tr === p.discipline.tr)) disciplines.push(p.discipline);
  const list = filter === 'all' ? projects : projects.filter((p) => p.discipline.tr === filter);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-index-row]', {
        yPercent: 60,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [filter]);

  useEffect(() => {
    refreshSoon();
  }, [filter]);

  // Kapak, imlecin şerit içindeki yatay konumuna göre hafifçe ters yöne kayar
  const drift = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || reducedMotion) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - 0.5;
    gsap.to(e.currentTarget.querySelector('[data-strip-drift]'), { xPercent: x * -6, duration: 0.9, ease: 'power3.out' });
  };

  return (
    <section ref={sectionRef} id="isler" className="relative bg-paper pb-[14vh] pt-[16vh]">
      <div className="gutter flex flex-col gap-6 border-b border-ink/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="display text-[clamp(2.6rem,5vw,6rem)]">{t(play.workTitle)}</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t(play.workTitle)}>
          {[{ key: 'all', label: play.all }, ...disciplines.map((d) => ({ key: d.tr, label: d }))].map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`pill min-h-11 px-4 ${filter === f.key ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>
      <ul>
        {list.map((p, i) => {
          const active = hover === p.slug;
          return (
            <li key={p.slug} className="overflow-hidden border-b border-ink/15">
              <a
                data-index-row
                href={`/proje/${p.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  openProject(p.slug, p.cover, active ? e.currentTarget.querySelector<HTMLElement>('[data-strip]') : null);
                }}
                className="group gutter relative grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 py-[2.4vh] sm:grid-cols-12 sm:items-baseline sm:gap-8"
              >
                {/* Başlık şeridi: numaranın sağından disiplin sütununa kadar, satırın tam yüksekliğinde (yalnızca fareyle, geniş ekranda).
                    Dış kutu fare alanıdır; kırpılan iç kutu kapağı ortadan yukarı ve aşağı açılan bir perdeyle gösterir */}
                <span
                  aria-hidden
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(p.slug)}
                  onPointerMove={drift}
                  onPointerLeave={() => setHover((h) => (h === p.slug ? null : h))}
                  className="absolute inset-y-0 left-12 right-0 col-start-1 col-end-10 hidden lg:block"
                >
                  <span
                    data-strip
                    className={`absolute inset-0 overflow-hidden transition-[clip-path] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none ${active ? '[clip-path:inset(0%_0%_0%_0%)]' : '[clip-path:inset(50%_0%_50%_0%)]'}`}
                  >
                    <span data-strip-drift className="absolute -inset-x-[4%] inset-y-0">
                      <img
                        src={p.cover}
                        alt=""
                        loading="lazy"
                        className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none ${active ? 'scale-100' : 'scale-125'}`}
                      />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/20 to-ink/0" />
                  </span>
                </span>
                <img src={p.cover} alt="" className="row-span-2 aspect-[4/3] w-20 rounded-md object-cover sm:hidden" />
                <span className="hidden text-sm font-medium tabular-nums opacity-40 sm:col-span-1 sm:block">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`display pointer-events-none relative text-[clamp(2rem,6vw,6.5rem)] leading-[1] transition-[transform,color] duration-500 ease-out max-lg:group-hover:translate-x-3 sm:col-span-8 ${active ? 'translate-x-6 text-paper' : ''}`}
                >
                  {p.title}
                </span>
                <span className="text-sm font-medium opacity-60 sm:col-span-2">{t(p.discipline)}</span>
                <span className="hidden text-right text-sm font-medium tabular-nums opacity-60 sm:col-span-1 sm:block">{p.year}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Services() {
  const { t } = useLang();
  const { openProject } = useTransition();
  return (
    <section id="hizmetler" data-theme="dark" className="gutter bg-ink py-[14vh] text-paper">
      <h2 className="display text-[clamp(2.6rem,5vw,6rem)]">{t(play.servicesTitle)}</h2>
      <div className="mt-[7vh] grid gap-10 md:grid-cols-3 md:gap-8">
        {play.services.map((s, i) => {
          const example = projects.find((p) => p.slug === s.example);
          return (
            <FadeUp key={s.title.en} delay={i * 0.08} className="flex flex-col gap-4 border-t border-white/15 pt-6">
              <p className="text-sm font-medium text-accent">0{i + 1}</p>
              <h3 className="display text-[clamp(2rem,3vw,3.5rem)]">{t(s.title)}</h3>
              <p className="max-w-sm text-[clamp(1rem,1.05vw,1.3rem)] leading-snug text-paper/75">{t(s.text)}</p>
              {example && (
                <button
                  type="button"
                  onClick={() => openProject(example.slug, example.cover)}
                  className="pill mt-2 min-h-11 self-start border-paper/40 px-4 hover:border-paper hover:bg-paper hover:text-ink"
                >
                  {t(play.exampleLabel)}: {example.title} <span aria-hidden>→</span>
                </button>
              )}
            </FadeUp>
          );
        })}
      </div>
    </section>
  );
}

export default function Home({ ready }: { ready: boolean }) {
  usePageMeta();
  useEffect(() => {
    refreshSoon();
  }, []);
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <PlayHero ready={ready} />
      <ProjectIndex />
      <Services />
      <Contact />
    </main>
  );
}
