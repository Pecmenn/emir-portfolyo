import { useLayoutEffect, useRef } from 'react';
import { projects, ui, work, type Project } from '../content';
import { Star } from '../components/Marquee';
import { Lines, RevealImage } from '../components/Reveal';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// fill: geniş ekranda görsel sabit oran yerine bulunduğu sütunda kalan yüksekliği doldurur
function Card({
  project,
  index,
  className = '',
  ratio,
  fill = false,
}: {
  project: Project;
  index: number;
  className?: string;
  ratio: string;
  fill?: boolean;
}) {
  const { t } = useLang();
  const { openProject } = useTransition();
  const mediaRef = useRef<HTMLDivElement>(null);

  return (
    <a
      href={`/proje/${project.slug}`}
      onClick={(e) => {
        e.preventDefault();
        openProject(project.slug, project.cover, mediaRef.current);
      }}
      data-cursor={t(ui.view)}
      className={`group ${fill ? 'flex flex-col sm:min-h-0 sm:flex-1' : 'block'} ${className}`}
    >
      <p className="mb-2 text-right text-xs font-medium text-mute">{String(index + 1).padStart(2, '0')}</p>
      <div ref={mediaRef} className={fill ? 'sm:min-h-0 sm:flex-1' : ''}>
        <RevealImage
          src={project.cover}
          alt={project.title}
          className={fill ? `${ratio} sm:aspect-auto sm:h-full` : ratio}
          imgClassName="transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between text-sm font-medium">
        {/* Nokta başlığın soluna taşar; böylece başlık görselin kenarıyla aynı hizada kalır */}
        <span className="relative">
          <span className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 scale-0 rounded-full bg-accent transition-transform group-hover:scale-100" />
          {project.title}
        </span>
        <span className="text-mute">{t(project.discipline)}</span>
      </div>
    </a>
  );
}

export default function Work() {
  const { t, lang } = useLang();
  const starRef = useRef<HTMLDivElement>(null);
  // Projeler ikişer ikişer satırlara bölünür
  const rows: Project[][] = [];
  for (let i = 0; i < projects.length; i += 2) rows.push(projects.slice(i, i + 2));

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.to(starRef.current, {
        rotate: 360,
        ease: 'none',
        scrollTrigger: { trigger: starRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="isler" className="gutter bg-paper pb-16 sm:pb-[8vh]">
      <div className="mb-10 flex items-baseline justify-between border-t border-ink/10 pt-6 text-sm font-medium">
        <span>{t(ui.allWork)}</span>
        <span className="text-mute">{String(projects.length).padStart(2, '0')}</span>
      </div>
      <div className="flex flex-col gap-16 sm:gap-[12vh]">
        {rows.map(([big, small], r) => {
          // Satırlar dönüşümlü: çift satırda büyük kart solda, tek satırda sağda. Küçük kartın görseli kalan yüksekliği doldurur,
          // böylece iki görselin alt kenarı aynı hizada biter.
          const mirrored = r % 2 === 1;
          const slogan = work.slogans[r];
          return (
            <div key={big.slug} className="grid gap-x-4 gap-y-16 sm:grid-cols-12">
              <Card
                project={big}
                index={r * 2}
                ratio="aspect-[10/7]"
                className={mirrored ? 'sm:col-span-7 sm:col-start-6 sm:row-start-1' : 'sm:col-span-7'}
              />
              {small && (
                <div
                  className={`flex flex-col gap-10 sm:col-span-5 sm:row-start-1 sm:gap-12 ${mirrored ? 'sm:col-start-1' : 'sm:col-start-8'}`}
                >
                  {slogan && (
                    <Lines
                      key={lang}
                      as="p"
                      lines={slogan[lang]}
                      className={`display pt-6 text-[clamp(1.6rem,2.4vw,3rem)] leading-[1.05] ${mirrored ? 'sm:mr-[20%]' : 'sm:ml-[20%]'}`}
                    />
                  )}
                  <Card project={small} index={r * 2 + 1} ratio="aspect-[5/4]" fill />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div ref={starRef} className="mx-auto mt-20 w-fit sm:mt-[10vh]">
        <Star className="h-8 w-8" />
      </div>
    </section>
  );
}
