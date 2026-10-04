import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { projects, ui, type CaseStudy, type GalleryBlock, type Project as ProjectType } from '../content';
import AutoVideo from '../components/AutoVideo';
import { EDGE_FADE, FadeUp, RevealImage, Words } from '../components/Reveal';
import { useLang } from '../lib/i18n';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { gsap, reducedMotion, refreshSoon, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';
import NotFound from './NotFound';

gsap.registerPlugin(Draggable, InertiaPlugin);

function Cover({ project }: { project: ProjectType }) {
  const { t, lang } = useLang();
  const { coverReady } = useTransition();
  const ref = useRef<HTMLElement>(null);

  // Yalnızca videolu projede beklenecek bir kapak görseli yok; geçiş animasyonu hemen devam etsin
  useEffect(() => {
    if (!project.cover) coverReady();
  }, [project.cover, coverReady]);

  // Açılışta başlık ve yıl maskeden kayar, alt çizgi soldan çizilir, alt bilgiler belirir.
  // Kaydırırken kapak görseli yavaşça aşağı kayar (parallax)
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-cover-line]', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.7 });
      gsap.from('[data-cover-rule]', { scaleX: 0, duration: 1.4, ease: 'expo.inOut', delay: 0.8 });
      gsap.from('[data-cover-fade]', { y: 16, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 1.1 });
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/65" />

      {/* Başlık solda, özet sağdaki üçte birlik sütunda; ikisi aynı alt çizgiye oturur */}
      <div className="gutter absolute inset-x-0 bottom-[calc(clamp(6.5rem,15vh,11rem)+2rem)] grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <h1 className="display text-[clamp(3.5rem,7vw,9rem)] lg:col-span-8">
          <span className="line-mask">
            <span data-cover-line className="block">
              {project.title}
            </span>
          </span>
        </h1>
        <Words
          key={lang}
          immediate
          delay={0.9}
          text={t(project.summary)}
          className="max-w-xl text-[clamp(1.05rem,1vw,1.5rem)] font-medium leading-snug text-paper/90 lg:col-span-4 lg:pb-[0.35em]"
        />
      </div>

      <div className="gutter absolute inset-x-0 bottom-0">
        <p className="line-mask display mb-[3vh] text-[clamp(1.75rem,2.2vw,3rem)]">
          <span data-cover-line className="block">
            {project.year}
          </span>
        </p>
        <div data-cover-rule className="h-px origin-left bg-white/25" />
        <div className="grid grid-cols-2 items-center gap-8 py-5 text-sm font-medium lg:grid-cols-12">
          <span data-cover-fade className="lg:col-span-4">
            {t(project.discipline)}
          </span>
          <span data-cover-fade className="hidden text-paper/70 lg:col-span-4 lg:block">
            {project.client}
          </span>
          <button data-cover-fade onClick={() => scrollToTarget('#kunye')} className="justify-self-end hover:text-accent lg:col-span-4">
            {t(ui.credits)} ↓
          </button>
        </div>
      </div>
    </section>
  );
}

function Credits({ project, dark, canvas }: { project: ProjectType; dark?: boolean; canvas?: string }) {
  const { t, lang } = useLang();
  const rows = [
    { label: ui.client, value: project.client },
    { label: ui.role, value: t(project.role) },
    { label: ui.services, value: t(project.services) },
  ];
  // Künye solda dört sütunda, giriş paragrafı kapaktaki istemci yazısıyla aynı (üçte bir) çizgiden başlar
  return (
    <section
      id="kunye"
      data-theme={dark ? 'dark' : undefined}
      style={canvas ? { backgroundColor: canvas } : undefined}
      className={`gutter grid gap-12 pb-[12vh] pt-[14vh] lg:grid-cols-12 lg:gap-8 ${dark ? 'bg-ink text-paper' : 'bg-paper'}`}
    >
      <FadeUp className="lg:col-span-4">
        <dl className="grid gap-8 text-[clamp(1.05rem,1.05vw,1.5rem)] leading-snug sm:grid-cols-3 lg:grid-cols-1">
          {rows.map((row) => (
            <div key={row.label.en}>
              <dt className="text-mute">{t(row.label)}</dt>
              <dd className="mt-1 font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </FadeUp>
      <Words
        key={lang}
        text={t(project.intro)}
        className="display text-[clamp(1.6rem,2vw,3rem)] leading-[1.12] lg:col-span-8"
      />
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
    <section data-theme="dark" className="gutter bg-ink py-[12vh] text-paper">
      <div className="grid gap-10 border-b border-white/10 pb-[8vh] md:grid-cols-3 md:gap-8">
        {steps.map((step, i) => (
          <FadeUp key={step.label.en} delay={i * 0.08}>
            <p className="mb-4 text-sm font-medium text-accent">
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

// Galeri blokları sayfa kenar boşluklarının içinde aynı ızgaraya oturur; görseller arasında dar, metinlerin
// çevresinde geniş boşluk bırakılır
function Block({ block, title, dark, canvas, chapter }: { block: GalleryBlock; title: string; dark?: boolean; canvas?: boolean; chapter: number }) {
  const { t, lang } = useLang();
  if (block.type === 'chapter') return <Chapter index={chapter} title={t(block.title)} text={t(block.text)} />;
  if (block.type === 'pair' && canvas) {
    // Kesintisiz zeminde görseller kırpılmadan, kendi oranlarıyla yan yana durur
    return (
      <div className="gutter mx-auto grid w-full max-w-[1760px] items-start gap-[var(--gap)] sm:grid-cols-2">
        <RevealImage hoverZoom natural fade capHeight={false} src={block.image1} alt={title} />
        <RevealImage hoverZoom natural fade capHeight={false} src={block.image2} alt={title} />
      </div>
    );
  }
  if (block.type === 'pair') {
    return (
      <div className="gutter grid gap-[var(--gap)] sm:grid-cols-2">
        <RevealImage hoverZoom src={block.image1} alt={title} className="aspect-[4/5] sm:aspect-[4/3]" />
        <RevealImage hoverZoom src={block.image2} alt={title} className="aspect-[4/5] sm:aspect-[4/3]" />
      </div>
    );
  }
  if (block.type === 'video') {
    if (!block.video) return null;
    return (
      <div className="gutter grid lg:grid-cols-12 lg:gap-8">
        <FadeUp className={`aspect-video overflow-hidden bg-black/5 ${block.full ? 'lg:col-span-12' : 'lg:col-span-8 lg:col-start-3'}`}>
          <AutoVideo src={block.video} className="h-full w-full object-cover" />
        </FadeUp>
      </div>
    );
  }
  if (block.type === 'text-image') {
    const imageRight = block.side === 'right';
    return (
      <div className="gutter grid gap-8 py-[5vh] lg:grid-cols-12 lg:items-start">
        <Words
          key={lang}
          text={t(block.text)}
          className={`display max-w-xl text-[clamp(1.4rem,1.7vw,2.6rem)] leading-[1.15] lg:sticky lg:top-28 lg:col-span-4 ${imageRight ? '' : 'lg:order-2'}`}
        />
        <RevealImage hoverZoom natural fade={dark} src={block.image} alt={title} className={`lg:col-span-8 ${imageRight ? '' : 'lg:order-1'}`} />
      </div>
    );
  }
  if (block.type === 'text') {
    // Bölüm başlığı solda, açıklama sağda; ikisi aynı alt çizgiye oturur
    return (
      <div className="gutter grid gap-6 pb-[4vh] pt-[10vh] lg:grid-cols-12 lg:items-end lg:gap-8">
        <Words key={`t-${lang}`} as="h2" text={t(block.title)} className="display text-[clamp(2.2rem,3.6vw,5.5rem)] leading-[1.02] lg:col-span-6" />
        <Words
          key={`p-${lang}`}
          text={t(block.text)}
          className="max-w-xl text-[clamp(1.05rem,1.1vw,1.55rem)] font-medium leading-snug opacity-75 lg:col-span-5 lg:col-start-8 lg:pb-[0.4em]"
        />
      </div>
    );
  }
  if (block.type === 'showcase') {
    if (!block.image) return null;
    return <Showcase image={block.image} alt={title} />;
  }
  if (block.type === 'strip') {
    const images = block.images.filter(Boolean);
    if (!images.length) return null;
    return <Strip images={images} alt={title} />;
  }
  return (
    <>
      {canvas ? (
        // Görselin kenarları zeminle aynı renkte; ortada, ekranı taşırmayan bir genişlikte kesintisiz durur
        <div className="mx-auto w-full max-w-[1760px]">
          <RevealImage hoverZoom natural fade capHeight={false} src={block.image} alt={title} />
        </div>
      ) : (
        <div className="gutter">
          <RevealImage hoverZoom natural fade={dark} src={block.image} alt={title} />
        </div>
      )}
      {/* Alıntı, görselin altında ortalanmış büyük bir cümle olarak durur */}
      {block.quote && (t(block.quote) || '').trim() && (
        <div className="gutter py-[7vh] text-center">
          <Words key={lang} as="h2" text={t(block.quote)} className="display mx-auto max-w-[22ch] text-[clamp(2.2rem,3.6vw,5.5rem)] leading-[1.05]" />
        </div>
      )}
    </>
  );
}

// Numaralı bölüm açılışı: ince çizgi soldan çizilir, büyük numara ve başlık maskeden kayar, açıklama kelime kelime gelir
function Chapter({ index, title, text }: { index: number; title: string; text: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
      tl.from('[data-chapter-rule]', { scaleX: 0, duration: 1.4, ease: 'expo.inOut' });
      tl.from('[data-chapter-num]', { yPercent: 110, duration: 1.2, ease: 'expo.out' }, 0.3);
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className="gutter pb-[8vh] pt-[18vh]">
      <div data-chapter-rule className="h-px origin-left bg-current opacity-20" />
      <div className="mt-[4vh] grid gap-6 lg:grid-cols-12 lg:gap-8">
        <p className="line-mask display text-[clamp(4.5rem,11vw,15rem)] leading-[0.85] opacity-25 lg:col-span-4">
          <span data-chapter-num className="block">
            {String(index).padStart(2, '0')}
          </span>
        </p>
        <div className="lg:col-span-8">
          <Words key={`c-${lang}`} as="h2" text={title} className="display text-[clamp(2.6rem,4.8vw,7.5rem)] leading-[0.98]" />
          {text.trim() && (
            <Words
              key={`ct-${lang}`}
              text={text}
              className="mt-[4vh] max-w-2xl text-[clamp(1.05rem,1.15vw,1.6rem)] font-medium leading-snug opacity-75"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Görsel kaydırınca aşağıdan yükselerek belirir; fare hareketine göre 3 boyutlu eğilir
function Showcase({ image, alt }: { image: string; alt: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const riseRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        riseRef.current,
        { y: 140, scale: 0.9, rotateX: 14, opacity: 0 },
        {
          y: 0,
          scale: 1,
          rotateX: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: stageRef.current, start: 'top 95%', end: 'top 25%', scrub: 0.8 },
        },
      );
    }, stageRef);
    return () => ctx.revert();
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const r = stageRef.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(tiltRef.current, { rotateY: px * 16, rotateX: -py * 12, duration: 0.9, ease: 'power3.out' });
  };
  const onLeave = () => gsap.to(tiltRef.current, { rotateY: 0, rotateX: 0, duration: 1.2, ease: 'power3.out' });

  return (
    <div ref={stageRef} onPointerMove={onMove} onPointerLeave={onLeave} className="gutter py-[4vh] [perspective:1800px]">
      <div ref={riseRef} className="[transform-style:preserve-3d]">
        <div ref={tiltRef} className="will-change-transform [transform-style:preserve-3d]">
          <img
            src={image}
            alt={alt}
            draggable={false}
            onLoad={refreshSoon}
            style={EDGE_FADE}
            className="mx-auto block h-auto max-h-[92vh] w-auto max-w-full select-none"
          />
        </div>
      </div>
    </div>
  );
}

// Yatayda sürüklenen görsel şeridi: bırakınca ataletle kayar, kenarlarda yumuşakça durur
function Strip({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Draggable | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      [dragRef.current] = Draggable.create(trackRef.current, {
        type: 'x',
        bounds: wrapRef.current,
        inertia: true,
        edgeResistance: 0.85,
        allowNativeTouchScrolling: true,
        cursor: 'grab',
        activeCursor: 'grabbing',
      });
      if (!reducedMotion) {
        gsap.from('[data-strip-item]', {
          x: 160,
          opacity: 0,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: wrapRef.current, start: 'top 80%' },
        });
      }
    }, wrapRef);
    return () => ctx.revert();
  }, [images.join('|')]);

  return (
    <div className="py-[4vh]">
      <p className="gutter mb-5 flex items-center gap-2 text-sm font-medium opacity-60">
        <span aria-hidden>←</span> {t(ui.drag)} <span aria-hidden>→</span>
      </p>
      <div ref={wrapRef} className="overflow-hidden">
        <div ref={trackRef} className="gutter flex w-max select-none gap-[var(--gap)]">
          {images.map((src, i) => (
            <img
              key={`${src}-${i}`}
              data-strip-item
              src={src}
              alt={alt}
              draggable={false}
              // Görseller yüklendikçe şerit genişler; sürükleme sınırları yeniden hesaplanır
              onLoad={() => {
                refreshSoon();
                dragRef.current?.applyBounds(wrapRef.current!);
              }}
              className="h-[clamp(20rem,80vh,60rem)] w-auto max-w-none"
            />
          ))}
        </div>
      </div>
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
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="display text-[clamp(3.5rem,7vw,9rem)]">{project.title}</span>
          <span className="mt-5 text-[clamp(1rem,1vw,1.4rem)] font-medium">{t(ui.next)}</span>
          <span className="mt-1 text-sm text-paper/60">{t(project.discipline)}</span>
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
      <Credits project={project} dark={project.dark} canvas={project.canvas} />
      {project.caseStudy && <CaseStudySection data={project.caseStudy} />}
      <div
        data-theme={project.dark ? 'dark' : undefined}
        style={project.canvas ? { backgroundColor: project.canvas } : undefined}
        className={`flex flex-col gap-[var(--gap)] pb-[14vh] [--gap:clamp(0.75rem,1vw,1.5rem)] ${project.dark ? 'bg-ink text-paper' : 'bg-paper'} ${project.caseStudy ? 'pt-[12vh]' : ''}`}
      >
        {project.gallery.map((block, i) => (
          <Block
            key={i}
            block={block}
            title={project.title}
            dark={project.dark}
            canvas={!!project.canvas}
            chapter={project.gallery.slice(0, i + 1).filter((b) => b.type === 'chapter').length}
          />
        ))}
      </div>
      <NextProject project={next} />
    </main>
  );
}
