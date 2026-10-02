import { manifesto, site, ui } from '../content';
import { FadeUp, Lines } from '../components/Reveal';
import { useLang } from '../lib/i18n';

export default function Manifesto() {
  const { t, lang } = useLang();
  return (
    <section id="hakkimda" className="gutter bg-paper py-20 sm:py-[14vh]">
      <p className="mb-8 text-sm font-medium text-mute">{t(manifesto.label)}</p>
      {/* İki eşit sütun: solda büyük cümle sütunu doldurur, sağda paragraf dikeyde ortalanır, buton altında ortada */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Lines key={lang} lines={manifesto.lines[lang]} className="display text-[clamp(2.6rem,4.4vw,7.5rem)] leading-[1]" />
        <FadeUp className="lg:self-center">
          <p className="text-[clamp(1.15rem,1.8vw,2.4rem)] font-medium leading-[1.35] tracking-tight">{t(manifesto.text)}</p>
          <div className="mt-8 flex lg:mt-12 lg:justify-center">
            <a href={site.cv} download className="pill border-ink bg-ink px-6 py-3 text-base text-paper hover:bg-transparent hover:text-ink">
              {t(ui.cv)} <span aria-hidden>↓</span>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
