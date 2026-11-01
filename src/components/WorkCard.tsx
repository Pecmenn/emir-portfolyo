import type { Area, Project } from '../content';
import { useLang } from '../lib/i18n';
import { refreshSoon } from '../lib/scroll';
import { useTransition } from '../lib/transition';

export const AREA_LABEL: Record<Area, string> = { design: 'Design', build: 'Build', automate: 'Automate' };

// Proje kartı: köşeleri yuvarlak kapak (hover'da yavaşça yakınlaşır), sol üstte alan etiketi, altında ad ve disiplin.
// Birden fazla alanı olan projelerin etiketi şarap renginde olur
export default function WorkCard({ project, className = '' }: { project: Project; className?: string }) {
  const { t } = useLang();
  const { openProject } = useTransition();
  const areas = project.areas ?? ['design'];
  return (
    <a
      href={`/proje/${project.slug}`}
      onClick={(e) => {
        e.preventDefault();
        openProject(project.slug);
      }}
      className={`group block ${className}`}
    >
      <span className="relative block aspect-[16/11] overflow-hidden rounded-[clamp(14px,1.4vw,22px)] bg-coal-2">
        <img
          src={project.cover}
          alt=""
          loading="lazy"
          onLoad={refreshSoon}
          className="h-full w-full scale-[1.02] object-cover saturate-[.92] transition-[transform,filter] duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.07] group-hover:saturate-100"
        />
        <span
          lang="en"
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] backdrop-blur ${areas.length > 1 ? 'bg-wine' : 'bg-coal/70'}`}
        >
          {areas.map((a) => AREA_LABEL[a]).join(' · ')}
        </span>
      </span>
      <span className="flex items-baseline justify-between gap-4 pt-4">
        <span lang="en" className="display text-[clamp(1.9rem,2.8vw,2.8rem)]">
          {project.title}
        </span>
        <span className="text-right text-sm text-stone">{t(project.discipline)}</span>
      </span>
    </a>
  );
}
