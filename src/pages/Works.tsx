import { useEffect, useRef, useState } from 'react';
import { play, projects, site, type Area } from '../content';
import WorkCard, { AREA_LABEL } from '../components/WorkCard';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { refreshSoon } from '../lib/scroll';

// Bütün işler: Design / Build / Automate filtreli iki sütunlu kart ızgarası
const AREAS: Area[] = ['design', 'build', 'automate'];

export default function Works() {
  const { t } = useLang();
  const [filter, setFilter] = useState<Area | 'all'>('all');
  const gridRef = useRef<HTMLDivElement>(null);
  usePageMeta(`${t(play.work.all)} · ${site.name}`);
  const list = filter === 'all' ? projects : projects.filter((p) => (p.areas ?? ['design']).includes(filter));
  const count = (a: Area) => projects.filter((p) => (p.areas ?? ['design']).includes(a)).length;

  // Filtre değişince kartlar sırayla yumuşakça yükselir
  useEffect(() => {
    const cards = Array.from(gridRef.current?.children ?? []) as HTMLElement[];
    cards.forEach((c, i) => {
      c.classList.remove('is-in');
      c.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('is-in')));
    });
    refreshSoon();
  }, [filter]);

  return (
    <main id="main" tabIndex={-1} className="gutter min-h-[100svh] pb-[clamp(80px,10vw,140px)] pt-[calc(68px+clamp(40px,7vw,96px))] outline-none">
      <div className="mb-10 flex flex-col gap-8 border-b border-seam pb-8 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="display text-[clamp(4rem,11vw,10rem)]">{t(play.work.all)}</h1>
        {/* Telefonda dört düğme tek satıra sığsın diye sayılar gizlenir, düğmeler sıkılaşır */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2" role="group" aria-label={t(play.work.all)}>
          {(['all', ...AREAS] as const).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(key)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-300 sm:px-5 sm:text-[15px] ${
                  active ? 'border-wine bg-wine text-cream' : 'border-seam text-stone hover:border-cream hover:text-cream'
                }`}
              >
                <span lang={key === 'all' ? undefined : 'en'}>{key === 'all' ? t(play.all) : AREA_LABEL[key]}</span>
                <span className="hidden text-xs tabular-nums opacity-70 sm:inline">{key === 'all' ? projects.length : count(key)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div ref={gridRef} className="grid gap-x-[clamp(14px,1.6vw,24px)] gap-y-[clamp(32px,4vw,56px)] md:grid-cols-2">
        {list.map((p) => (
          <div key={p.slug} className="soft-rise">
            <WorkCard project={p} />
          </div>
        ))}
      </div>
    </main>
  );
}
