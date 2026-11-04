import { useState } from 'react';
import type { Project } from '../content';
import { useLang } from '../lib/i18n';
import { useTransition } from '../lib/transition';
import { AREA_LABEL } from './WorkCard';

const SOFT = 'ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none';

// Seçili işler: yan yana dar ve uzun kapak şeritleri. Fareyle üzerine gelinen şerit genişleyip projenin adını gösterir
// ve fare ayrılınca da açık kalır; açık şeride tıklamak projeyi açar. Telefonda şeritler alt alta dizilir, kapalıyken
// proje adı üstünde yazar: ilk dokunuş şeridi açar, ikincisi projeye götürür
export default function WorkStrips({ projects }: { projects: Project[] }) {
  const { t } = useLang();
  const { openProject } = useTransition();
  const [active, setActive] = useState(0);
  return (
    <ul className="flex h-[min(84svh,660px)] flex-col gap-1.5 md:h-[clamp(420px,66vh,700px)] md:flex-row">
      {projects.map((p, i) => {
        const on = i === active;
        const areas = p.areas ?? ['design'];
        return (
          <li key={p.slug} className={`min-h-0 min-w-0 flex-1 transition-[flex-grow] duration-700 ${SOFT} ${on ? 'grow-[5] md:grow-[7]' : ''}`}>
            <a
              href={`/proje/${p.slug}`}
              // Dokunmatikte pointerenter dokunuştan hemen önce gelir; yalnızca fare açarsa ilk dokunuş projeye atlamaz
              onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
              onFocus={(e) => e.currentTarget.matches(':focus-visible') && setActive(i)}
              onClick={(e) => {
                e.preventDefault();
                if (on) openProject(p.slug);
                else setActive(i);
              }}
              style={{ transitionDelay: `${i * 70}ms` }}
              className="soft-rise group relative block h-full w-full overflow-hidden rounded-[clamp(14px,1.6vw,24px)] bg-coal-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
            >
              <img
                src={p.cover}
                alt=""
                loading="lazy"
                draggable={false}
                style={{ objectPosition: `${p.coverFocus ?? 50}% 50%` }}
                className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1100ms] ${SOFT} ${on ? '' : 'scale-[1.06] brightness-[.68] saturate-[.85]'}`}
              />
              <span
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-t from-coal/90 via-coal/10 to-transparent transition-opacity duration-500 motion-reduce:transition-none ${on ? 'opacity-100' : 'opacity-0'}`}
              />
              <span
                lang="en"
                className={`absolute left-4 top-4 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] backdrop-blur transition-opacity duration-500 motion-reduce:transition-none ${
                  areas.length > 1 ? 'bg-wine' : 'bg-coal/70'
                } ${on ? 'opacity-100 delay-200' : 'opacity-0'}`}
              >
                {areas.map((a) => AREA_LABEL[a]).join(' · ')}
              </span>
              <span
                className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-[clamp(16px,1.8vw,28px)] transition-[opacity,transform] duration-500 motion-reduce:transition-none ${SOFT} ${
                  on ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-3 opacity-0'
                }`}
              >
                <span className="min-w-0">
                  <span lang="en" className="display block whitespace-nowrap text-[clamp(2.4rem,4.4vw,4.6rem)]">
                    {p.title}
                  </span>
                  <span className="mt-2 block whitespace-nowrap text-sm text-cream/75">{t(p.discipline)}</span>
                </span>
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine text-cream transition-colors duration-300 group-hover:bg-[#7F141D]">
                  →
                </span>
              </span>
              {/* Telefonda kapalı şeridin adı */}
              <span
                aria-hidden
                lang="en"
                className={`display absolute inset-0 flex items-center bg-gradient-to-r from-coal/75 via-coal/25 to-transparent px-4 text-[1.6rem] transition-opacity duration-300 motion-reduce:transition-none md:hidden ${on ? 'opacity-0' : 'opacity-100'}`}
              >
                {p.title}
              </span>
              {/* Koyu kapaklı şeritler siyah zeminde kaybolmasın diye ince kenar */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-cream/10" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
