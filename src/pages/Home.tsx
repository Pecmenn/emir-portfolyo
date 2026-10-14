import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { play, projects, type Project, type Text } from '../content';
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

// Dev puntolu proje listesi; disipline göre süzülür. Fareyle bir projenin üstüne gelince kapağı imleci izler
function ProjectIndex() {
  const { t } = useLang();
  const { openProject } = useTransition();
  const [filter, setFilter] = useState('all');
  const [hover, setHover] = useState<Project | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
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

  const follow = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !previewRef.current) return;
    gsap.to(previewRef.current, { x: e.clientX, y: e.clientY, duration: reducedMotion ? 0 : 0.6, ease: 'power3.out' });
  };

  return (
    <section ref={sectionRef} id="isler" onPointerMove={follow} className="relative bg-paper pb-[14vh] pt-[16vh]">
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
      <ul onPointerLeave={() => setHover(null)}>
        {list.map((p, i) => (
          <li key={p.slug} className="overflow-hidden border-b border-ink/15">
            <a
              data-index-row
              href={`/proje/${p.slug}`}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(p)}
              onClick={(e) => {
                e.preventDefault();
                openProject(p.slug, p.cover, hover?.slug === p.slug ? previewRef.current : null);
              }}
              className="group gutter grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 py-[2.4vh] sm:grid-cols-12 sm:items-baseline sm:gap-8"
            >
              <img src={p.cover} alt="" className="row-span-2 aspect-[4/3] w-20 rounded-md object-cover sm:hidden" />
              <span className="hidden text-sm font-medium tabular-nums opacity-40 sm:col-span-1 sm:block">{String(i + 1).padStart(2, '0')}</span>
              <span className="display text-[clamp(2rem,6vw,6.5rem)] leading-[1] transition-transform duration-500 ease-out group-hover:translate-x-3 sm:col-span-8">
                {p.title}
              </span>
              <span className="text-sm font-medium opacity-60 sm:col-span-2">{t(p.discipline)}</span>
              <span className="hidden text-right text-sm font-medium tabular-nums opacity-60 sm:col-span-1 sm:block">{p.year}</span>
            </a>
          </li>
        ))}
      </ul>
      {/* İmleci izleyen kapak önizlemesi; yalnızca fareyle görünür */}
      {/* Dış kutunun konumunu GSAP taşır; ortalama ve büyüyerek belirme iç kutuda */}
      <div ref={previewRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-40 hidden lg:block">
        <div
          className={`w-[clamp(16rem,24vw,26rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-300 ${hover ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        >
          {projects.map((p) => (
            <img key={p.slug} src={p.cover} alt="" className={`aspect-[4/3] w-full object-cover ${hover?.slug === p.slug ? 'block' : 'hidden'}`} />
          ))}
        </div>
      </div>
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
