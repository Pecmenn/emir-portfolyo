import { manifesto, site, ui } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import { useLang } from '../lib/i18n';

export default function Manifesto() {
  const { t, lang } = useLang();
  return (
    <section id="hakkimda" className="gutter bg-paper py-20 sm:py-[14vh]">
      <p className="mb-8 text-sm font-medium text-mute">{t(manifesto.label)}</p>
      <Lines key={lang} lines={manifesto.lines[lang]} className="display max-w-[14ch] text-[clamp(2.8rem,7vw,6.5rem)]" />
      <FadeUp className="mt-[10vh] grid sm:grid-cols-2">
        <div className="sm:col-start-2 sm:max-w-md">
          <p className="text-lg leading-relaxed">{t(manifesto.text)}</p>
          <div className="mt-8 flex gap-2">
            <a href={site.cv} download className="pill border-ink bg-ink text-paper hover:bg-transparent hover:text-ink">
              {t(ui.cv)} <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
