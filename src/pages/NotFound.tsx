import { ui } from '../content';
import { useLang } from '../lib/i18n';
import { useTransition } from '../lib/transition';

export default function NotFound() {
  const { t } = useLang();
  const { goTo } = useTransition();
  return (
    <main data-theme="dark" className="gutter flex min-h-[100svh] flex-col items-start justify-end bg-ink pb-16 text-paper">
      <p className="display text-[clamp(6rem,20vw,18rem)]">404</p>
      <p className="mb-8 text-lg">{t(ui.notFound)}</p>
      <button onClick={() => goTo('/')} className="pill border-paper/60 hover:bg-paper hover:text-ink">
        ← {t(ui.home)}
      </button>
    </main>
  );
}
