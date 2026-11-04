import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { projects, site, ui, type CaseStudy, type GalleryBlock, type Project as ProjectType, type Step } from '../content';
import AutoVideo from '../components/AutoVideo';
import { RevealImage } from '../components/Reveal';
import { Magnetic, Roll } from '../components/Roll';
import Scenes from '../components/Scenes';
import { AREA_LABEL } from '../components/WorkCard';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { useSoftReveal } from '../lib/reveal';
import { refreshSoon } from '../lib/scroll';
import { useTransition } from '../lib/transition';
import NotFound from './NotFound';

// Proje sayfası (Design. Build. Automate. kimliği). Tek şablon, iki kullanım:
// - Tasarım işi: başlık ve künye, tam genişlikte kapak, giriş metni, bölüm başlıkları ve görseller.
// - Otomasyon işi: aynı düzene "Sorun → Nasıl çalışıyor → Sonuç" bölümü (caseStudy) ve akış şeması bloğu (flow) eklenir.
// Görsel dizileri (pan, strip, flock) sakin ızgaralar olarak dizilir. Eski "dünya", "yolculuk" ve "oyun" blokları
// bu düzende gösterilmez (kodları park/oyun-ve-dunyalar dalında).
// Projede sahneler (scenes) varsa kapak, giriş metni ve galeri yerine kaydırmayla oynayan sahneler gösterilir.

function Intro({ project, bare }: { project: ProjectType; bare?: boolean }) {
  const { t, lang } = useLang();
  const { coverReady } = useTransition();
  const ref = useRef<HTMLElement>(null);

  // Yalnızca videolu projede beklenecek bir kapak görseli yok; geçiş hemen açılsın
  useEffect(() => {
    if (!project.cover || bare) coverReady();
  }, [project.cover, bare, coverReady]);

  // Geçiş perdesi kalktıktan sonra başlık ve kapak yumuşakça açılır
  useEffect(() => {
    const id = window.setTimeout(() => ref.current?.classList.add('is-in'), 450);
    return () => window.clearTimeout(id);
  }, [project.slug]);

  const meta = [
    { label: ui.client, value: project.client },
    { label: ui.role, value: t(project.role) },
    { label: ui.services, value: t(project.services) },
    { label: ui.year, value: project.year },
  ].filter((m) => m.value?.trim());
  const areas = project.areas ?? ['design'];

  return (
    <section ref={ref} className={`gutter pt-[calc(68px+clamp(32px,6vw,80px))] ${bare ? 'pb-[clamp(48px,7vw,96px)]' : ''}`}>
      <p className="soft-rise eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
        <span lang="en" className="text-wine-light">
          {areas.map((a) => AREA_LABEL[a]).join(' · ')}
        </span>
        <span aria-hidden>·</span>
        <span>{t(project.discipline)}</span>
      </p>
      <h1 lang="en" className="display mt-5 text-[clamp(3.6rem,11vw,11rem)]">
        <span className="line-mask soft-line">
          <span>{project.title}</span>
        </span>
      </h1>
      <div className="soft-rise mt-8 grid gap-8 border-t border-seam pt-7 [transition-delay:.15s] lg:grid-cols-12 lg:gap-10">
        <p className="max-w-[36ch] text-[clamp(1.15rem,1.5vw,1.45rem)] leading-[1.35] lg:col-span-5">
          <span key={lang}>{t(project.summary)}</span>
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-[15px] sm:grid-cols-4 lg:col-span-7">
          {meta.map((row) => (
            <div key={row.label.en}>
              <dt className="eyebrow">{t(row.label)}</dt>
              <dd className="mt-2 font-medium leading-snug">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {!bare && (
        <div className="soft-cover card relative mt-[clamp(32px,5vw,64px)] aspect-[4/5] bg-coal-2 sm:aspect-[16/9]">
          {project.cover && (
            <img
              src={project.cover}
              alt=""
              onLoad={coverReady}
              onError={coverReady}
              style={{ ['--fx' as string]: `${project.coverFocus ?? 50}%` }}
              className="absolute inset-0 h-full w-full object-cover [object-position:var(--fx)_50%] md:[object-position:50%_50%]"
            />
          )}
          {project.coverVideo && (
            <div className="absolute inset-0">
              <AutoVideo src={project.coverVideo} poster={project.cover || undefined} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Giriş metni: kapaktan sonra büyük ve sade bir paragraf
function Lead({ project }: { project: ProjectType }) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref, [lang]);
  if (!t(project.intro).trim()) return null;
  return (
    <section ref={ref} className="gutter grid py-[clamp(72px,10vw,140px)] lg:grid-cols-12">
      <p key={lang} className="soft-rise text-[clamp(1.4rem,2.3vw,2.4rem)] font-medium leading-[1.25] tracking-[-0.015em] lg:col-span-10 lg:col-start-3">
        {t(project.intro)}
      </p>
    </section>
  );
}

// Otomasyon işlerinde: sorun, nasıl çalışıyor, sonuç ve rakamlar
function CaseStudySection({ data }: { data: CaseStudy }) {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  const steps = [
    { label: ui.challenge, text: data.challenge },
    { label: ui.process, text: data.process },
    { label: ui.result, text: data.result },
  ].filter((s) => t(s.text).trim());
  return (
    <section ref={ref} className="gutter pb-[clamp(72px,10vw,140px)]">
      <div className="grid gap-px overflow-hidden rounded-[22px] border border-seam bg-seam md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.label.en} className={`soft-rise grid content-start gap-4 bg-coal-2 p-[clamp(22px,2.4vw,36px)] ${['', '[transition-delay:.1s]', '[transition-delay:.2s]'][i]}`}>
            <p className="flex items-baseline gap-3">
              <span className="text-sm tabular-nums text-wine-light">0{i + 1}</span>
              <span className="display text-[clamp(1.8rem,2.4vw,2.4rem)]">{t(step.label)}</span>
            </p>
            <p className="text-cream/85">{t(step.text)}</p>
          </div>
        ))}
      </div>
      {data.metrics.length > 0 && (
        <div className="mt-[clamp(20px,2.4vw,32px)] grid gap-[clamp(14px,1.6vw,24px)] sm:grid-cols-3">
          {data.metrics.map((m, i) => (
            <div key={m.value + i} className={`soft-rise border-t border-seam pt-5 ${['', '[transition-delay:.1s]', '[transition-delay:.2s]'][i % 3]}`}>
              <p className="display text-[clamp(3.6rem,7vw,7rem)] text-wine-bright">{m.value}</p>
              <p className="mt-2 max-w-[30ch] text-stone">{t(m.label)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Bölüm başı: ince çizgi, solda (varsa) bölüm numarası, sağda başlık ve açıklama
function SectionHead({ index, title, text }: { index?: number; title: string; text: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useSoftReveal(ref, [lang]);
  if (!title.trim() && !text.trim()) return null;
  return (
    <div ref={ref} data-reveal className="gutter pb-[clamp(20px,2.4vw,32px)] pt-[clamp(72px,10vw,140px)]">
      <div className="grid gap-4 border-t border-seam pt-6 lg:grid-cols-12 lg:gap-8">
        <p className="text-sm tabular-nums text-wine-light lg:col-span-3">{index ? String(index).padStart(2, '0') : ''}</p>
        <div className="lg:col-span-9">
          {title.trim() && (
            <h2 className="display text-[clamp(2.8rem,5.4vw,6rem)]">
              {title.split('\n').map((l, i) => (
                <span key={`${lang}-${i}`} className="line-mask soft-line">
                  <span>{l}</span>
                </span>
              ))}
            </h2>
          )}
          {text.trim() && <p className="soft-rise mt-5 max-w-[48ch] text-[clamp(1.05rem,1.15vw,1.3rem)] leading-snug text-stone">{text}</p>}
        </div>
      </div>
    </div>
  );
}

// Akış şeması: adımlar soldan sağa (telefonda yukarıdan aşağı) birbirine bağlı kutular
function Flow({ title, text, steps }: { title: string; text: string; steps: Step[] }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useSoftReveal(ref);
  if (!steps.length) return null;
  return (
    <>
      <SectionHead title={title} text={text} />
      <div ref={ref} className="gutter">
        <ol className="grid gap-3 lg:grid-flow-col lg:auto-cols-fr lg:gap-0">
          {steps.map((step, i) => (
            <li key={i} className="soft-rise relative flex lg:pr-10 lg:last:pr-0" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="grid w-full content-start gap-3 rounded-[18px] border border-seam bg-coal-2 p-5">
                <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold tabular-nums ${i === 0 || i === steps.length - 1 ? 'bg-wine text-cream' : 'bg-coal-3 text-wine-light'}`}>
                  {i + 1}
                </span>
                <h3 className="display text-[clamp(1.6rem,2vw,2.1rem)]">{t(step.title)}</h3>
                <p className="text-[15px] leading-snug text-stone">{t(step.text)}</p>
              </div>
              {i < steps.length - 1 && (
                <span aria-hidden className="absolute right-0 top-1/2 hidden h-px w-10 -translate-y-1/2 bg-stone/50 lg:block">
                  <span className="absolute -right-0.5 -top-[3px] h-[7px] w-[7px] rotate-45 border-r border-t border-stone" />
                </span>
              )}
              {i < steps.length - 1 && <span aria-hidden className="absolute -bottom-3 left-9 h-3 w-px bg-stone/50 lg:hidden" />}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

// Görsel ızgarası: ekranlar kendi oranlarıyla, saydam zeminli parçalar (cutout) kare kutularda ortalanır
function Grid({ title, text, images, alt, cutout }: { title?: string; text?: string; images: string[]; alt: string; cutout?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useSoftReveal(ref, [images.join('|')]);
  const cols = cutout ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : images.length > 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4';
  return (
    <>
      {(title?.trim() || text?.trim()) && <SectionHead title={title ?? ''} text={text ?? ''} />}
      <div ref={ref} className={`gutter grid items-start gap-[var(--gap)] ${cols}`}>
        {images.map((src, i) => (
          <figure key={`${src}-${i}`} className={`soft-rise card bg-coal-2 ${cutout ? 'grid aspect-square place-items-center p-[12%]' : ''}`} style={{ transitionDelay: `${Math.min(i, 8) * 50}ms` }}>
            <img
              src={src}
              alt={alt}
              loading="lazy"
              onLoad={refreshSoon}
              className={cutout ? 'h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]' : 'block h-auto w-full'}
            />
          </figure>
        ))}
      </div>
    </>
  );
}

function Wide({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="gutter">
      <RevealImage natural capHeight={false} src={src} alt={alt} className="card bg-coal-2" />
    </div>
  );
}

function Block({ block, chapter }: { block: GalleryBlock; chapter: number }) {
  const { t, lang } = useLang();
  const alt = 'alt' in block && block.alt ? t(block.alt) : '';
  switch (block.type) {
    case 'chapter':
      return <SectionHead index={chapter} title={t(block.title)} text={t(block.text)} />;
    case 'text':
      return <SectionHead title={t(block.title)} text={t(block.text)} />;
    case 'flow':
      return <Flow title={t(block.title)} text={t(block.text)} steps={block.steps} />;
    case 'full':
      return (
        <>
          {block.image && <Wide src={block.image} alt={alt} />}
          {block.quote && t(block.quote).trim() && (
            <div className="gutter py-[clamp(48px,7vw,96px)] text-center">
              <p key={lang} className="mx-auto max-w-[26ch] text-[clamp(1.6rem,2.6vw,3rem)] font-medium leading-[1.15] tracking-[-0.015em]">
                {t(block.quote)}
              </p>
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
              <RevealImage natural capHeight={false} src={src} alt={alt} className="card bg-coal-2" />
              {label && <span className="absolute left-3 top-3 rounded-full bg-coal/80 px-3 py-1 text-xs font-medium text-cream backdrop-blur">{label}</span>}
            </div>
          ))}
        </div>
      );
    }
    case 'text-image': {
      const right = block.side === 'right';
      return (
        <div className="gutter grid gap-8 py-[4vh] lg:grid-cols-12 lg:items-start lg:gap-8">
          <p key={lang} className={`max-w-xl text-[clamp(1.3rem,1.7vw,2rem)] font-medium leading-[1.25] lg:sticky lg:top-28 lg:col-span-4 ${right ? '' : 'lg:order-2'}`}>
            {t(block.text)}
          </p>
          <div className={`lg:col-span-8 ${right ? '' : 'lg:order-1'}`}>
            <RevealImage natural capHeight={false} src={block.image} alt={alt} className="card bg-coal-2" />
          </div>
        </div>
      );
    }
    case 'video':
      if (!block.video) return null;
      return (
        <div className="gutter">
          <div className={`card aspect-video bg-coal-2 ${block.full ? '' : 'mx-auto max-w-[1100px]'}`}>
            <AutoVideo src={block.video} className="h-full w-full object-cover" />
          </div>
        </div>
      );
    case 'showcase':
      if (!block.image) return null;
      return (
        <div className="gutter">
          <div className="card grid place-items-center bg-coal-2 p-[5%]">
            <img src={block.image} alt={alt} loading="lazy" onLoad={refreshSoon} className="max-h-[80vh] w-auto max-w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.4)]" />
          </div>
        </div>
      );
    case 'pan':
    case 'strip':
    case 'flock': {
      const images = block.images.filter(Boolean);
      if (!images.length) return null;
      const head = block.type === 'strip' ? {} : { title: t(block.title), text: t(block.text) };
      return <Grid {...head} images={images} alt={alt} cutout={block.type === 'flock'} />;
    }
    default:
      // journey ve game blokları bu düzende gösterilmez
      return null;
  }
}

// Sayfanın sonunda bir sonraki proje: başlık harf harf yuvarlanır, kapak kartı hafifçe yakınlaşır
function NextProject({ project }: { project: ProjectType }) {
  const { t } = useLang();
  const { openProject } = useTransition();
  return (
    <section className="gutter pb-[10vh] pt-[clamp(80px,11vw,160px)]">
      <button type="button" onClick={() => openProject(project.slug)} className="group block w-full text-left focus-visible:outline-none">
        <div className="flex flex-col gap-6 border-t border-seam pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{t(ui.next)}</p>
            <p lang="en" className="display mt-3 text-[clamp(3rem,8vw,10rem)]">
              <Roll text={project.title} />
            </p>
          </div>
          <span className="btn self-start group-hover:border-wine group-hover:bg-wine sm:self-auto">
            {t(ui.openProject)} <span aria-hidden className="arrow">→</span>
          </span>
        </div>
        <div className="card mt-8 aspect-[16/10] bg-coal-2 sm:aspect-[16/7]">
          <img src={project.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none" />
        </div>
      </button>
    </section>
  );
}

// Vaka sayfasını bitiren ziyaretçi için iletişime çıkış
function ContactStrip() {
  const { t, lang } = useLang();
  const { goTo } = useTransition();
  return (
    <section className="gutter border-t border-seam py-[10vh]">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="display max-w-[14ch] text-[clamp(2.8rem,6vw,7rem)]">{t(ui.contactCta)}</h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Magnetic>
            <button onClick={() => goTo('/', 'iletisim')} className="btn btn-wine">
              {t(ui.getInTouch)} <span aria-hidden className="arrow">→</span>
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
  let chapter = 0;

  if (project.scenes?.length)
    return (
      <main id="main" tabIndex={-1} key={project.slug} className="outline-none">
        <Intro project={project} bare />
        <Scenes scenes={project.scenes} font={project.sceneFont} />
        <NextProject project={next} />
        <ContactStrip />
      </main>
    );

  return (
    <main id="main" tabIndex={-1} key={project.slug} className="outline-none">
      <Intro project={project} />
      <Lead project={project} />
      {project.caseStudy && <CaseStudySection data={project.caseStudy} />}
      <div className="flex flex-col gap-[var(--gap)] [--gap:clamp(0.75rem,1vw,1.25rem)]">
        {project.gallery.map((block, i) => {
          if (block.type === 'chapter') chapter += 1;
          return <Block key={i} block={block} chapter={chapter} />;
        })}
      </div>
      <NextProject project={next} />
      <ContactStrip />
    </main>
  );
}
