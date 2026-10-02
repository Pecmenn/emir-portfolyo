import { useLayoutEffect, useRef } from 'react';
import { projects, ui, type Project } from '../content';
import { Star } from '../components/Marquee';
import { RevealImage } from '../components/Reveal';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Asimetrik ızgara düzeni: her satır farklı genişlik ve dikey kaymayla tekrar eder
const layout = [
  'sm:col-span-7 sm:col-start-1',
  'sm:col-span-4 sm:col-start-9 sm:mt-[18vh]',
  'sm:col-span-5 sm:col-start-2',
  'sm:col-span-5 sm:col-start-8 sm:mt-[12vh]',
  'sm:col-span-6 sm:col-start-1',
  'sm:col-span-5 sm:col-start-8 sm:mt-[18vh]',
];
const ratios = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square', 'aspect-[5/4]', 'aspect-[3/4]'];

function Card({ project, index }: { project: Project; index: number }) {
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
      className={`group block ${layout[index % layout.length]}`}
    >
      <p className="mb-2 text-right text-xs font-medium text-mute">{String(index + 1).padStart(2, '0')}</p>
      <div ref={mediaRef}>
        <RevealImage
          src={project.cover}
          alt={project.title}
          className={ratios[index % ratios.length]}
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
  const { t } = useLang();
  const starRef = useRef<HTMLDivElement>(null);

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
      <div className="grid gap-x-4 gap-y-16 sm:grid-cols-12 sm:gap-y-[10vh]">
        {projects.map((project, i) => (
          <Card key={project.slug} project={project} index={i} />
        ))}
      </div>
      <div ref={starRef} className="mx-auto mt-20 w-fit sm:mt-[10vh]">
        <Star className="h-8 w-8" />
      </div>
    </section>
  );
}
