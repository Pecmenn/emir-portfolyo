import { manifesto, site, ui } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import { useLang } from '../lib/i18n';

export default function Manifesto() {
  const { t, lang } = useLang();
  return (
    <section id="hakkimda" className="gutter bg-paper py-20 sm:py-[14vh]">
      <p className="mb-8 text-sm font-medium text-mute">{t(manifesto.label)}</p>
      {/* Büyük cümle solda, paragraf sağda cümlenin son satırıyla aynı hizada biter */}
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Lines key={lang} lines={manifesto.lines[lang]} className="display text-[clamp(2.6rem,6vw,6rem)] lg:col-span-8" />
        <FadeUp className="max-w-md lg:col-span-4 lg:pb-[0.6vw]">
          <p className="text-lg leading-relaxed">{t(manifesto.text)}</p>
          <a href={site.cv} download className="pill mt-6 border-ink bg-ink text-paper hover:bg-transparent hover:text-ink">
            {t(ui.cv)} <span aria-hidden>↓</span>
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
