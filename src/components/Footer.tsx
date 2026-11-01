import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { site, ui } from '../content';
import { useLang } from '../lib/i18n';
import { navLinks } from '../lib/nav';
import { scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';
import SocialIcon from './SocialIcon';

// Sade alt bilgi: telif, menü, sosyal bağlantılar ve yukarı dönüş
export default function Footer() {
  const { t } = useLang();
  const { goTo } = useTransition();
  const { pathname } = useLocation();
  const go = (id: string) => (pathname === '/' ? scrollToTarget(`#${id}`) : goTo('/', id));

  return (
    <footer className="border-t border-seam">
      <div className="gutter flex flex-col gap-6 py-7 text-sm text-stone md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name} · <span lang="en">Design. Build. Automate.</span>
        </p>
        <nav aria-label={t(ui.sitemap)} className="flex flex-wrap gap-x-6 gap-y-2">
          {navLinks.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className="min-h-11 transition-colors hover:text-cream">
              {t(item.label)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="grid h-11 w-11 place-items-center rounded-full border border-seam text-cream transition-colors hover:border-wine hover:bg-wine"
            >
              <SocialIcon href={s.href} label={s.label} className="h-[18px] w-[18px]" />
            </a>
          ))}
          <button
            onClick={() => scrollToTarget(0)}
            aria-label={t(ui.backToTop)}
            className="ml-2 grid h-11 w-11 place-items-center rounded-full border border-seam text-cream transition-colors hover:border-cream"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}
