import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { play, projects, type Text } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import { Magnetic, Roll } from '../components/Roll';
import Contact from '../sections/Contact';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { gsap, reducedMotion, refreshSoon, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Ana sayfa: üstte kısa tanıtım ve oyunlardaki objelerin gerçek 3B modelleriyle dolu bir kutu, ardından büyük cümle,
// filtrelenebilen proje indeksi, hizmetler ve iletişim. Metinler src/content/play.json'da, panelde "Ana sayfa" altında.

// three.js ve modeller metinden sonra yüklenir; açılış yazısı beklemeden görünür
const ObjectPit = lazy(() => import('../components/ObjectPit'));

function Hero({ ready }: { ready: boolean }) {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  // Açılış ekranı kalkınca üst satır yukarı kayarak belirir, kutu alttan açılır
  useLayoutEffect(() => {
    if (reducedMotion || !ready) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-line]', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.07 });
      gsap.fromTo('[data-hero-box]', { clipPath: 'inset(18% 6% 0% 6% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'expo.inOut' });
    }, ref);
    return () => ctx.revert();
  }, [ready]);

  return (
    <section ref={ref} className="gutter flex h-[100svh] min-h-[620px] flex-col bg-paper pb-3 pt-[76px] sm:pb-4 sm:pt-[88px]">
      <div className="grid gap-3 pb-4 sm:pb-5 lg:grid-cols-12 lg:items-end lg:gap-8">
        <p className="line-mask text-[clamp(1rem,1.1vw,1.3rem)] font-medium lg:col-span-4">
          <span data-hero-line className="block">
            {t(play.hello)}
          </span>
        </p>
        <p className="max-w-[34ch] text-[clamp(1.2rem,2.05vw,2.35rem)] leading-[1.12] tracking-[-0.025em] lg:col-span-8 lg:col-start-5">
          <span className="line-mask">
            <span data-hero-line className="block">
              {t(play.text)}
            </span>
          </span>
        </p>
      </div>

      {/* Kutu: koyu morumsu zeminde 3B objeler; köşelerde ipucu ve objelerin kaynağı */}
      <div data-hero-box className="card relative min-h-0 flex-1 bg-night text-paper">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(98,54,255,0.42),rgba(18,14,34,0)_70%)]" />
        <Suspense fallback={null}>
          <ObjectPit className={`absolute inset-0 transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`} onReady={() => setLoaded(true)} />
        </Suspense>
        {!reducedMotion && (
          <p aria-hidden className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-paper/70 sm:left-6 sm:top-5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />
            {t(touch ? play.hintTouch : play.hint)}
          </p>
        )}
        {play.pitCaption && t(play.pitCaption) && (
          <p className="pointer-events-none absolute bottom-4 left-4 max-w-[22rem] text-xs leading-snug text-paper/55 sm:bottom-5 sm:left-6">{t(play.pitCaption)}</p>
        )}
        <button
          type="button"
          onClick={() => scrollToTarget('#isler')}
          className="absolute bottom-3 right-3 hidden min-h-11 items-center gap-2 rounded-full px-4 text-xs font-medium uppercase tracking-[0.14em] text-paper/70 transition-colors hover:text-paper sm:bottom-4 sm:right-4 sm:flex"
        >
          {t(play.ctaWork)} <span aria-hidden>↓</span>
        </button>
      </div>
    </section>
  );
}

// Büyük cümle: normal kalınlıkta dev yazı; altında tanıtım düğmeleri
function Statement() {
  const { t, lang } = useLang();
  return (
    <section className="gutter grid gap-10 bg-paper pb-[12vh] pt-[16vh] lg:grid-cols-12 lg:gap-8">
      <Lines key={lang} as="h1" lines={play.statement[lang]} className="display text-[clamp(3rem,8.6vw,11rem)] leading-[0.92] lg:col-span-12" />
      <FadeUp className="flex flex-wrap gap-3 lg:col-span-6 lg:col-start-7">
        <Magnetic>
          <button type="button" onClick={() => scrollToTarget('#isler')} className="pill min-h-12 border-ink bg-ink px-6 text-base text-paper transition-colors hover:border-accent hover:bg-accent">
            {t(play.ctaWork)} <span aria-hidden>↓</span>
          </button>
        </Magnetic>
        <Magnetic>
          <button type="button" onClick={() => scrollToTarget('#iletisim')} className="pill min-h-12 border-ink/25 px-6 text-base hover:border-ink">
            {t(play.ctaContact)}
          </button>
        </Magnetic>
      </FadeUp>
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
                  <Roll text={p.title} />
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
              <p className="text-sm font-medium text-accent-soft">0{i + 1}</p>
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
      <Hero ready={ready} />
      <Statement />
      <ProjectIndex />
      <Services />
      <Contact />
    </main>
  );
}
