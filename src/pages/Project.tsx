import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { projects, ui, type CaseStudy, type GalleryBlock, type Project as ProjectType } from '../content';
import AutoVideo from '../components/AutoVideo';
import { FadeUp, Lines, RevealImage } from '../components/Reveal';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion, refreshSoon, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';
import NotFound from './NotFound';

function Cover({ project }: { project: ProjectType }) {
  const { t } = useLang();
  const { coverReady } = useTransition();
  const ref = useRef<HTMLElement>(null);

  // Yalnızca videolu projede beklenecek bir kapak görseli yok; geçiş animasyonu hemen devam etsin
  useEffect(() => {
    if (!project.cover) coverReady();
  }, [project.cover, coverReady]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-cover-line]', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: 0.7 });
      // Kaydırırken kapak görseli yavaşça yukarı kayar
      gsap.to('[data-cover-img]', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [project.slug]);

  return (
    <section ref={ref} data-theme="dark" className="relative h-[100svh] overflow-hidden bg-ink text-paper">
      {project.cover && (
        <img
          data-cover-img
          src={project.cover}
          alt={project.title}
          onLoad={coverReady}
          onError={coverReady}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Kapak videosu görselin üstünde oynar; geçiş animasyonu görsel üzerinden yapıldığı için görsel altta kalır */}
      {project.coverVideo && (
        <div data-cover-img className="absolute inset-0">
          <AutoVideo src={project.coverVideo} poster={project.cover || undefined} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <div className="gutter absolute inset-x-0 bottom-[22vh] grid items-end gap-6 sm:grid-cols-2">
        <h1 className="display text-[clamp(4rem,12vw,11rem)]">
          <span className="line-mask">
            <span data-cover-line className="block">
              {project.title}
            </span>
          </span>
        </h1>
        <p className="max-w-md text-lg leading-snug sm:justify-self-end">
          <span className="line-mask">
            <span data-cover-line className="block">
              {t(project.summary)}
            </span>
          </span>
        </p>
      </div>
      <div className="gutter absolute inset-x-0 bottom-0">
        <p className="display mb-6 text-3xl">{project.year}</p>
        <div className="flex items-center justify-between border-t border-white/20 py-5 text-sm font-medium">
          <span>{t(project.discipline)}</span>
          <button onClick={() => scrollToTarget('#kunye')} className="hover:text-accent">
            {t(ui.credits)} ↓
          </button>
        </div>
      </div>
    </section>
  );
}

function Credits({ project }: { project: ProjectType }) {
  const { t } = useLang();
  const rows = [
    { label: ui.client, value: project.client },
    { label: ui.role, value: t(project.role) },
    { label: ui.services, value: t(project.services) },
  ];
  return (
    <section id="kunye" className="gutter grid gap-12 bg-paper py-[14vh] lg:grid-cols-12">
      <dl className="space-y-5 text-sm lg:col-span-3">
        {rows.map((row) => (
          <div key={row.label.en}>
            <dt className="font-medium">{t(row.label)}</dt>
            <dd className="text-mute">{row.value}</dd>
          </div>
        ))}
      </dl>
      <FadeUp className="lg:col-span-8 lg:col-start-5">
        <p className="display text-[clamp(1.6rem,2.8vw,2.6rem)] font-medium leading-[1.15] tracking-tight">{t(project.intro)}</p>
      </FadeUp>
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
    <section data-theme="dark" className="gutter bg-ink py-[14vh] text-paper">
      <div className="grid gap-10 border-b border-white/10 pb-16 md:grid-cols-3">
        {steps.map((step, i) => (
          <FadeUp key={step.label.en} delay={i * 0.08}>
            <p className="mb-4 text-sm font-medium text-accent">
              0{i + 1} — {t(step.label)}
            </p>
            <p className="text-lg leading-relaxed text-paper/85">{t(step.text)}</p>
          </FadeUp>
        ))}
      </div>
      <div className="grid gap-10 pt-16 sm:grid-cols-3">
        {data.metrics.map((m, i) => (
          <FadeUp key={m.value} delay={i * 0.08}>
            <p className="display text-[clamp(3.5rem,8vw,7rem)]">{m.value}</p>
            <p className="mt-2 text-sm text-mute">{t(m.label)}</p>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

function Block({ block, title }: { block: GalleryBlock; title: string }) {
  const { t, lang } = useLang();
  if (block.type === 'pair') {
    return (
      <div className="gutter grid gap-4 sm:grid-cols-12" data-cursor="+">
        <RevealImage src={block.image1} alt={title} className="aspect-[4/5] sm:col-span-6" />
        <RevealImage src={block.image2} alt={title} className="aspect-[4/5] sm:col-span-4 sm:col-start-9 sm:mt-[20vh]" />
      </div>
    );
  }
  if (block.type === 'video') {
    if (!block.video) return null;
    return block.full ? (
      <div className="relative h-[100svh] overflow-hidden bg-ink">
        <AutoVideo src={block.video} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    ) : (
      <div className="gutter">
        <FadeUp className="aspect-video overflow-hidden bg-black/5">
          <AutoVideo src={block.video} className="h-full w-full object-cover" />
        </FadeUp>
      </div>
    );
  }
  if (block.type === 'text-image') {
    const imageRight = block.side === 'right';
    return (
      <div className="gutter grid items-center gap-10 sm:grid-cols-2">
        <FadeUp className={imageRight ? '' : 'sm:order-2 sm:pl-[10%]'}>
          <p className="display max-w-md text-[clamp(1.4rem,2vw,1.9rem)] font-medium leading-tight tracking-tight">{t(block.text)}</p>
        </FadeUp>
        <RevealImage src={block.image} alt={title} className={`aspect-[4/5] ${imageRight ? '' : 'sm:order-1'}`} />
      </div>
    );
  }
  return (
    <div className="relative h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        <RevealImage src={block.image} alt={title} className="h-full" />
      </div>
      {block.quote && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 px-4 text-center text-paper">
          <Lines key={lang} lines={[t(block.quote)]} className="display text-[clamp(2.4rem,6vw,5.5rem)]" />
        </div>
      )}
    </div>
  );
}

// Sayfanın sonunda bir sonraki proje belirir; sona kadar kaydırınca otomatik geçilir
function NextProject({ project }: { project: ProjectType }) {
  const { t } = useLang();
  const { openProject } = useTransition();
  const ref = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    let fired = false;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaRef.current,
        { clipPath: 'inset(18% 22% 18% 22%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
              if (!fired && self.progress > 0.995 && self.direction > 0) {
                fired = true;
                openProject(project.slug, project.cover, mediaRef.current);
              }
            },
          },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, [project, openProject]);

  return (
    <section ref={ref} data-theme="dark" className="relative h-[220vh] bg-ink text-paper">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={mediaRef} className="absolute inset-0" style={reducedMotion ? undefined : { clipPath: 'inset(18% 22% 18% 22%)' }}>
          <img src={project.cover} alt={project.title} onLoad={refreshSoon} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        <button
          onClick={() => openProject(project.slug, project.cover, mediaRef.current)}
          data-cursor={t(ui.open)}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="mb-4 text-sm font-medium">{t(ui.next)}</span>
          <span className="display text-[clamp(4rem,12vw,11rem)]">{project.title}</span>
          <span className="mt-4 text-sm text-paper/70">{t(project.discipline)}</span>
        </button>
        <div className="gutter absolute inset-x-0 bottom-8 flex items-center gap-4 text-xs font-medium">
          <span>{t(ui.keepScrolling)}</span>
          <span className="h-px flex-1 bg-white/20">
            <span ref={barRef} className="block h-full origin-left scale-x-0 bg-accent" />
          </span>
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

  return (
    <main key={project.slug}>
      <Cover project={project} />
      <Credits project={project} />
      {project.caseStudy && <CaseStudySection data={project.caseStudy} />}
      <div className="flex flex-col gap-[16vh] bg-paper py-[14vh]">
        {project.gallery.map((block, i) => (
          <Block key={i} block={block} title={project.title} />
        ))}
      </div>
      <NextProject project={next} />
    </main>
  );
}
