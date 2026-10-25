import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { projects, site, ui, type CaseStudy, type GalleryBlock, type Project as ProjectType } from '../content';
import AutoVideo from '../components/AutoVideo';
import { FadeUp, RevealImage, Words } from '../components/Reveal';
import { Magnetic, Roll } from '../components/Roll';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { gsap, reducedMotion, refreshSoon } from '../lib/scroll';
import { useTransition } from '../lib/transition';
import NotFound from './NotFound';

// Proje sayfası (Lusion ve Dennis Snellenberg'den esinlenen sakin düzen): solda başlık ve künye, sağda kapak; kaydırdıkça
// kapak tüm genişliğe açılır. Ardından giriş metni büyük bir cümle olarak gelir, galeri blokları köşeleri yuvarlatılmış
// kartlar ve yatayda akan şeritler olarak dizilir, sayfa bir sonraki projeyle biter.
// Eski "dünya", "yolculuk" ve "oyun" blokları bu düzende gösterilmez (kodları park/oyun-ve-dunyalar dalında).

const RADIUS = 'round 20px';

function Intro({ project }: { project: ProjectType }) {
  const { t, lang } = useLang();
  const { coverReady } = useTransition();
  const ref = useRef<HTMLElement>(null);

  // Yalnızca videolu projede beklenecek bir kapak görseli yok; geçiş hemen açılsın
  useEffect(() => {
    if (!project.cover) coverReady();
  }, [project.cover, coverReady]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      gsap.from('[data-intro-line]', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.55 });
      gsap.from('[data-intro-fade]', { y: 18, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.85 });
      // Geniş ekranda bölüm sabitlenir: kapak sağdaki sütundan tüm genişliğe açılır, metin yukarı kayarak çekilir
      mm.add('(min-width: 1024px)', () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
        tl.fromTo('[data-intro-media]', { clipPath: `inset(0% 0% 0% 41% ${RADIUS})` }, { clipPath: `inset(0% 0% 0% 0% ${RADIUS})`, ease: 'none' }, 0)
          .fromTo('[data-intro-img]', { scale: 1.14 }, { scale: 1, ease: 'none' }, 0)
          .to('[data-intro-copy]', { yPercent: -12, opacity: 0, ease: 'none', duration: 0.55 }, 0);
      });
    }, ref);
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [project.slug]);

  const meta = [
    { label: ui.client, value: project.client },
    { label: ui.role, value: t(project.role) },
    { label: ui.services, value: t(project.services) },
  ];

  return (
    <section ref={ref} className="relative lg:h-[185vh]">
      <div className="gutter relative pb-4 pt-[84px] sm:pt-[96px] lg:sticky lg:top-0 lg:h-[100svh]">
        <div data-intro-copy className="relative z-[1] flex flex-col gap-8 lg:h-full lg:w-[37%] lg:justify-between lg:pb-4">
          <div>
            <p data-intro-fade className="text-sm font-medium opacity-60">
              {t(project.discipline)} · {project.year}
            </p>
            <h1 className="display mt-4 text-[clamp(3rem,5.4vw,7.25rem)] leading-[0.94]">
              <span className="line-mask">
                <span data-intro-line className="block">
                  {project.title}
                </span>
              </span>
            </h1>
            <Words key={lang} immediate delay={0.7} text={t(project.summary)} className="mt-6 max-w-[30ch] text-[clamp(1.15rem,1.35vw,1.6rem)] leading-[1.25] tracking-[-0.015em]" />
          </div>
          <dl className="grid gap-0 text-[15px]">
            {meta.map((row) => (
              <div key={row.label.en} data-intro-fade className="grid grid-cols-[7.5rem_1fr] gap-4 border-t py-3 [border-top-color:rgb(var(--line))]">
                <dt className="opacity-55">{t(row.label)}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          data-intro-media
          className="card relative mt-8 aspect-[4/5] bg-mist sm:aspect-[16/10] lg:absolute lg:inset-x-8 lg:bottom-4 lg:top-[96px] lg:mt-0 lg:aspect-auto"
        >
          {project.cover && (
            <img
              data-intro-img
              src={project.cover}
              alt=""
              onLoad={coverReady}
              onError={coverReady}
              style={{ ['--fx' as string]: `${project.coverFocus ?? 50}%` }}
              className="absolute inset-0 h-full w-full object-cover [object-position:var(--fx)_50%] md:[object-position:50%_50%]"
            />
          )}
          {project.coverVideo && (
            <div data-intro-img className="absolute inset-0">
              <AutoVideo src={project.coverVideo} poster={project.cover || undefined} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Giriş metni: kapaktan sonra büyük, normal kalınlıkta bir paragraf
function Lead({ project }: { project: ProjectType }) {
  const { t, lang } = useLang();
  if (!t(project.intro).trim()) return null;
  return (
    <section className="gutter grid pb-[10vh] pt-[14vh] lg:grid-cols-12 lg:gap-8">
      <Words key={lang} text={t(project.intro)} className="display text-[clamp(1.65rem,2.7vw,3.4rem)] leading-[1.1] tracking-[-0.03em] lg:col-span-10 lg:col-start-3" />
    </section>
  );
}

function CaseStudySection({ data }: { data: CaseStudy }) {
  const { t } = useLang();
  const steps = [
    { label: ui.challenge, text: data.challenge },
    { label: ui.process, text: data.process },
    { label: ui.result, text: data.result },
  ];
  return (
    <section data-theme="dark" className="gutter my-[6vh] bg-ink py-[12vh] text-paper">
      <div className="grid gap-10 border-b border-white/10 pb-[8vh] md:grid-cols-3 md:gap-8">
        {steps.map((step, i) => (
          <FadeUp key={step.label.en} delay={i * 0.08}>
            <p className="mb-4 text-sm font-medium text-accent-soft">
              0{i + 1} — {t(step.label)}
            </p>
            <p className="max-w-xl text-[clamp(1.05rem,1vw,1.4rem)] leading-relaxed text-paper/85">{t(step.text)}</p>
          </FadeUp>
        ))}
      </div>
      <div className="grid gap-10 pt-[8vh] sm:grid-cols-3 sm:gap-8">
        {data.metrics.map((m, i) => (
          <FadeUp key={m.value} delay={i * 0.08}>
            <p className="display text-[clamp(3.5rem,6vw,8rem)]">{m.value}</p>
            <p className="mt-3 text-sm text-mute">{t(m.label)}</p>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// Bölüm başı: ince çizgi, solda (varsa) bölüm numarası, sağda başlık ve açıklama
function SectionHead({ index, title, text }: { index?: number; title: string; text: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-head-rule]', { scaleX: 0, duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: ref.current, start: 'top 85%' } });
    }, ref);
    return () => ctx.revert();
  }, []);
  if (!title.trim() && !text.trim()) return null;
  return (
    <div ref={ref} className="gutter pb-[3vh] pt-[14vh]">
      <div data-head-rule className="h-px origin-left bg-current opacity-15" />
      <div className="mt-6 grid gap-4 lg:grid-cols-12 lg:gap-8">
        <p className="text-sm font-medium tabular-nums opacity-55 lg:col-span-3">{index ? String(index).padStart(2, '0') : ''}</p>
        <div className="lg:col-span-9">
          {title.trim() && <Words key={`h-${lang}`} as="h2" text={title} className="display text-[clamp(2.4rem,4.4vw,5.75rem)] leading-[0.98]" />}
          {text.trim() && <Words key={`p-${lang}`} text={text} className="mt-5 max-w-[46ch] text-[clamp(1.05rem,1.15vw,1.4rem)] leading-snug opacity-70" />}
        </div>
      </div>
    </div>
  );
}

// Sayfa genişliğinde kart: görsel kendi oranında, köşeleri yuvarlak; alttan perde gibi açılır
function Wide({ src, alt, tone }: { src: string; alt: string; tone: string }) {
  return (
    <div className="gutter">
      <RevealImage natural capHeight={false} src={src} alt={alt} className={`card ${tone}`} />
    </div>
  );
}

type RailItem = { src: string; label?: string };

// Yatayda akan şerit: geniş ekranda bölüm sabitlenir ve aşağı kaydırdıkça kartlar sola akar; telefonda parmakla kaydırılır.
// cutout: saydam zeminli parçalar (karakter, kaykay, obje) açık renkli bir kartın ortasında durur
function Rail({ title, text, items, alt, cutout, tone }: { title?: string; text?: string; items: RailItem[]; alt: string; cutout?: boolean; tone: string }) {
  const { lang } = useLang();
  const wrapRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const track = trackRef.current!;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        // Üst kap flex olduğu için GSAP boşluğu kendiliğinden eklemez (pinSpacing varsayılanı false olur); açıkça istenir
        scrollTrigger: { trigger: wrapRef.current, start: 'top top', end: () => `+=${dist()}`, pin: true, pinSpacing: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    });
    return () => mm.revert();
  }, [items.map((i) => i.src).join('|')]);

  const hasHead = !!(title?.trim() || text?.trim());
  return (
    <section ref={wrapRef} className="overflow-hidden py-[4vh] lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      {hasHead && (
        <div className="gutter mb-6 grid gap-3 lg:grid-cols-12 lg:items-end lg:gap-8">
          {title?.trim() && <Words key={`rt-${lang}`} as="h3" text={title} className="display text-[clamp(1.9rem,2.8vw,3.6rem)] leading-[1] lg:col-span-5" />}
          {text?.trim() && <p className="max-w-[44ch] text-[clamp(1rem,1.05vw,1.25rem)] leading-snug opacity-70 lg:col-span-5 lg:col-start-8">{text}</p>}
        </div>
      )}
      <div
        ref={trackRef}
        className="gutter flex gap-[var(--gap)] max-lg:snap-x max-lg:snap-mandatory max-lg:overflow-x-auto max-lg:[scrollbar-width:none] lg:w-max"
      >
        {items.map((item, i) => (
          <figure key={`${item.src}-${i}`} className={`card relative shrink-0 snap-start ${cutout ? `h-[52vh] w-[40vh] p-[4vh] lg:h-[62vh] lg:w-[47vh] ${tone}` : 'h-[50vh] lg:h-[62vh]'}`}>
            <img
              src={item.src}
              alt={alt}
              loading="eager"
              decoding="async"
              draggable={false}
              onLoad={refreshSoon}
              className={cutout ? 'h-full w-full select-none object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)]' : 'h-full w-auto max-w-none select-none'}
            />
            {item.label && <figcaption className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">{item.label}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

function Block({ block, chapter, tone }: { block: GalleryBlock; chapter: number; tone: string }) {
  const { t, lang } = useLang();
  const alt = 'alt' in block && block.alt ? t(block.alt) : '';
  switch (block.type) {
    case 'chapter':
      return <SectionHead index={chapter} title={t(block.title)} text={t(block.text)} />;
    case 'text':
      return <SectionHead title={t(block.title)} text={t(block.text)} />;
    case 'full':
      return (
        <>
          {block.image && <Wide src={block.image} alt={alt} tone={tone} />}
          {block.quote && t(block.quote).trim() && (
            <div className="gutter py-[8vh] text-center">
              <Words key={lang} as="h2" text={t(block.quote)} className="display mx-auto max-w-[22ch] text-[clamp(2.2rem,3.6vw,5rem)] leading-[1.04]" />
            </div>
          )}
        </>
      );
    case 'pair':
    case 'compare': {
      const [a, b, la, lb] =
        block.type === 'pair' ? [block.image1, block.image2, '', ''] : [block.before, block.after, t(block.beforeLabel), t(block.afterLabel)];
      if (!a || !b) return null;
      return (
        <div className="gutter grid gap-[var(--gap)] sm:grid-cols-2">
          {[
            [a, la],
            [b, lb],
          ].map(([src, label], i) => (
            <div key={i} className="relative">
              <RevealImage natural capHeight={false} src={src} alt={alt} className={`card ${tone}`} />
              {label && <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">{label}</span>}
            </div>
          ))}
        </div>
      );
    }
    case 'text-image': {
      const right = block.side === 'right';
      return (
        <div className="gutter grid gap-8 py-[4vh] lg:grid-cols-12 lg:items-start lg:gap-8">
          <Words key={lang} text={t(block.text)} className={`display max-w-xl text-[clamp(1.4rem,1.8vw,2.4rem)] leading-[1.15] lg:sticky lg:top-28 lg:col-span-4 ${right ? '' : 'lg:order-2'}`} />
          <div className={`lg:col-span-8 ${right ? '' : 'lg:order-1'}`}>
            <RevealImage natural capHeight={false} src={block.image} alt={alt} className={`card ${tone}`} />
          </div>
        </div>
      );
    }
    case 'video':
      if (!block.video) return null;
      return (
        <div className="gutter">
          <FadeUp className={`card aspect-video ${tone} ${block.full ? '' : 'mx-auto max-w-[1100px]'}`}>
            <AutoVideo src={block.video} className="h-full w-full object-cover" />
          </FadeUp>
        </div>
      );
    case 'showcase':
      if (!block.image) return null;
      return (
        <div className="gutter">
          <FadeUp className={`card grid place-items-center p-[5%] ${tone}`}>
            <img src={block.image} alt={alt} loading="lazy" onLoad={refreshSoon} className="max-h-[80vh] w-auto max-w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.2)]" />
          </FadeUp>
        </div>
      );
    case 'pan':
    case 'strip':
    case 'flock': {
      const images = block.images.filter(Boolean);
      if (!images.length) return null;
      const head = block.type === 'strip' ? {} : { title: t(block.title), text: t(block.text) };
      return <Rail {...head} items={images.map((src) => ({ src }))} alt={alt} cutout={block.type === 'flock'} tone={tone} />;
    }
    default:
      // journey ve game blokları bu düzende gösterilmez
      return null;
  }
}

// Sayfanın sonunda bir sonraki proje: başlık harf harf yuvarlanır, kapak kartı hafifçe yakınlaşır
function NextProject({ project, dark }: { project: ProjectType; dark?: boolean }) {
  const { t } = useLang();
  const { openProject } = useTransition();
  return (
    <section className="gutter pb-[10vh] pt-[12vh]">
      <button type="button" onClick={() => openProject(project.slug)} className="group block w-full text-left focus-visible:outline-none">
        <div className={`flex flex-col gap-6 border-t pt-6 sm:flex-row sm:items-end sm:justify-between ${dark ? 'border-white/15' : 'border-ink/15'}`}>
          <div>
            <p className="text-sm font-medium opacity-60">{t(ui.next)}</p>
            <p className="display mt-3 text-[clamp(3rem,8vw,10rem)] leading-[0.95]">
              <Roll text={project.title} />
            </p>
          </div>
          <span className={`pill min-h-12 self-start px-6 text-base transition-colors sm:self-auto ${dark ? 'border-paper/40 group-hover:bg-paper group-hover:text-ink' : 'border-ink/25 group-hover:border-accent group-hover:bg-accent group-hover:text-paper'}`}>
            {t(ui.openProject)} <span aria-hidden>→</span>
          </span>
        </div>
        <div className="card mt-8 aspect-[16/10] bg-mist sm:aspect-[16/7]">
          <img src={project.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.04] motion-reduce:transition-none" />
        </div>
      </button>
    </section>
  );
}

// Vaka sayfasını bitiren ziyaretçi için iletişime çıkış
function ContactStrip({ dark }: { dark?: boolean }) {
  const { t, lang } = useLang();
  const { goTo } = useTransition();
  return (
    <section className={`gutter border-t py-[10vh] ${dark ? 'border-white/10' : 'border-ink/10'}`}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="display max-w-[14ch] text-[clamp(2.6rem,5.6vw,6.5rem)]">{t(ui.contactCta)}</h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Magnetic>
            <button
              onClick={() => goTo('/', 'iletisim')}
              className={`pill min-h-12 px-6 text-base ${dark ? 'border-paper bg-paper text-ink hover:bg-transparent hover:text-paper' : 'border-ink bg-ink text-paper hover:border-accent hover:bg-accent'}`}
            >
              {t(ui.getInTouch)} <span aria-hidden>→</span>
            </button>
          </Magnetic>
          <a key={lang} href={`mailto:${site.email}`} className="inline-block py-2 text-base font-medium underline underline-offset-4">
            {site.email}
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Project() {
  const { slug } = useParams();
  const index = projects.findIndex((p) => p.slug === slug);

  useEffect(() => {
    refreshSoon();
  }, [slug]);

  if (index === -1) return <NotFound />;
  const project = projects[index];
  const next = projects[(index + 1) % projects.length];
  return <ProjectPage project={project} next={next} />;
}

function ProjectPage({ project, next }: { project: ProjectType; next: ProjectType }) {
  const { t } = useLang();
  usePageMeta(`${project.title} — ${t(project.discipline)} · ${site.name}`, t(project.summary));
  const dark = !!project.dark;
  // Kartların zemini: açık sayfada soluk lila, koyu sayfada saydam beyaz
  const tone = dark ? 'bg-white/[0.06]' : 'bg-mist';
  let chapter = 0;

  return (
    <main
      id="main"
      tabIndex={-1}
      key={project.slug}
      data-theme={dark ? 'dark' : undefined}
      className={`outline-none [--line:10_10_10_/_0.14] ${dark ? 'bg-ink text-paper [--line:255_255_255_/_0.14]' : 'bg-paper text-ink'}`}
    >
      <Intro project={project} />
      <Lead project={project} />
      {project.caseStudy && <CaseStudySection data={project.caseStudy} />}
      <div className="flex flex-col gap-[var(--gap)] [--gap:clamp(0.75rem,1vw,1.25rem)]">
        {project.gallery.map((block, i) => {
          if (block.type === 'chapter') chapter += 1;
          return <Block key={i} block={block} chapter={chapter} tone={tone} />;
        })}
      </div>
      <NextProject project={next} dark={dark} />
      <ContactStrip dark={dark} />
    </main>
  );
}
