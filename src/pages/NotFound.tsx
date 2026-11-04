import { ui } from '../content';
import { useLang } from '../lib/i18n';
import { useTransition } from '../lib/transition';

export default function NotFound() {
  const { t } = useLang();
  const { goTo } = useTransition();
  return (
    <main id="main" tabIndex={-1} className="gutter flex min-h-[100svh] flex-col items-start justify-end pb-16 outline-none">
      <p className="display text-[clamp(6rem,20vw,18rem)]">404</p>
      <p className="mb-8 text-lg">{t(ui.notFound)}</p>
      <button onClick={() => goTo('/')} className="btn">
        ← {t(ui.home)}
      </button>
    </main>
  );
}
